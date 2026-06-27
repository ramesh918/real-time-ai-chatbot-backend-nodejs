import { WebSocket } from 'ws';
import logger from '../utils/logger';

export interface Connection {
  ws: WebSocket;
  userId: string;
  conversationId: string;
  isAlive: boolean;
}

export class ConnectionManager {
  private connections: Map<string, Set<Connection>> = new Map();
  private userConnections: Map<string, Connection[]> = new Map();

  addConnection(conversationId: string, connection: Connection): void {
    if (!this.connections.has(conversationId)) {
      this.connections.set(conversationId, new Set());
    }
    this.connections.get(conversationId)!.add(connection);

    if (!this.userConnections.has(connection.userId)) {
      this.userConnections.set(connection.userId, []);
    }
    this.userConnections.get(connection.userId)!.push(connection);

    logger.info('Connection added', {
      conversationId,
      userId: connection.userId,
      totalConnections: this.connections.get(conversationId)!.size,
    });
  }

  removeConnection(conversationId: string, connection: Connection): void {
    const convConnections = this.connections.get(conversationId);
    if (convConnections) {
      convConnections.delete(connection);
      if (convConnections.size === 0) {
        this.connections.delete(conversationId);
      }
    }

    const userConns = this.userConnections.get(connection.userId);
    if (userConns) {
      const index = userConns.indexOf(connection);
      if (index > -1) {
        userConns.splice(index, 1);
      }
      if (userConns.length === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    logger.info('Connection removed', {
      conversationId,
      userId: connection.userId,
      totalConnections: convConnections?.size || 0,
    });
  }

  getConversationConnections(conversationId: string): Connection[] {
    return Array.from(this.connections.get(conversationId) || []);
  }

  getUserConnections(userId: string): Connection[] {
    return this.userConnections.get(userId) || [];
  }

  broadcast(conversationId: string, message: string, excludeUserId?: string): void {
    const connections = this.getConversationConnections(conversationId);
    connections.forEach((conn) => {
      if (excludeUserId && conn.userId === excludeUserId) return;
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  broadcastToUser(userId: string, message: string): void {
    const connections = this.getUserConnections(userId);
    connections.forEach((conn) => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  getConnectedConversations(): number {
    return this.connections.size;
  }

  getConnectedUsers(): number {
    return this.userConnections.size;
  }

  getTotalConnections(): number {
    return Array.from(this.connections.values()).reduce((sum, conns) => sum + conns.size, 0);
  }
}

export const connectionManager = new ConnectionManager();
