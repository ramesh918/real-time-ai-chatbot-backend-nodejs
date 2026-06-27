import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { WebSocketHandler } from './WebSocketHandler';
import logger from '../utils/logger';

export function createWebSocketServer(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const conversationId = url.searchParams.get('conversation_id');

    // Validate token
    if (!token) {
      ws.close(4001, 'Missing authentication token');
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      ws.close(4001, 'Invalid or expired token');
      return;
    }

    // Validate conversation ID
    if (!conversationId) {
      ws.close(4002, 'Missing conversation ID');
      return;
    }

    const userId = payload.userId;

    // Set up connection
    WebSocketHandler.handleConnection(ws, userId, conversationId).catch((error) => {
      logger.error('Connection setup error', { error });
      ws.close(1011, 'Internal server error');
    });

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        message.conversation_id = conversationId;
        await WebSocketHandler.handleMessage(ws, userId, conversationId, message);
      } catch (error) {
        logger.error('Message parsing error', { error });
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      WebSocketHandler.handleDisconnection(userId, conversationId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', { error, userId, conversationId });
    });

    // Heartbeat to detect dead connections
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
  });

  // Periodically ping all clients to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}
