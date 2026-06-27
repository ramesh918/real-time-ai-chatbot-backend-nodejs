import { WebSocket } from 'ws';
import { MessageRepository } from '../repositories/MessageRepository';
import { ConversationRepository } from '../repositories/ConversationRepository';
import { connectionManager } from './ConnectionManager';
import { redisManager } from './RedisManager';
import { WebSocketMessage } from '../models/types';
import logger from '../utils/logger';

export class WebSocketHandler {
  static async handleMessage(
    ws: WebSocket,
    userId: string,
    conversationId: string,
    message: WebSocketMessage
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'user_message':
          await this.handleUserMessage(ws, userId, conversationId, message);
          break;
        case 'heartbeat':
          ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date() }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
      }
    } catch (error) {
      logger.error('WebSocket message handling error', { error, userId, conversationId });
      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to process message',
        })
      );
    }
  }

  private static async handleUserMessage(
    ws: WebSocket,
    userId: string,
    conversationId: string,
    message: WebSocketMessage
  ): Promise<void> {
    if (!message.content) {
      ws.send(JSON.stringify({ type: 'error', error: 'Message content is required' }));
      return;
    }

    // Verify conversation ownership
    const conversation = await ConversationRepository.getConversationById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized' }));
      return;
    }

    // Persist user message
    const userMessage = await MessageRepository.createMessage(
      conversationId,
      userId,
      'user',
      message.content
    );

    // Broadcast user message locally
    const userMsgPayload = {
      type: 'user_message',
      id: userMessage.id,
      conversation_id: conversationId,
      sender_id: userId,
      role: 'user',
      content: userMessage.content,
      timestamp: userMessage.created_at,
    };

    connectionManager.broadcast(conversationId, JSON.stringify(userMsgPayload));

    // Publish to Redis for cross-instance fan-out
    const channel = redisManager.getConversationChannel(conversationId);
    await redisManager.publish(channel, JSON.stringify(userMsgPayload));

    // Generate mock assistant reply
    const assistantReply = this.generateMockReply(message.content);

    // Small delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Persist assistant message
    const assistantMsg = await MessageRepository.createMessage(
      conversationId,
      userId, // Assistant messages are still associated with the user's conversation
      'assistant',
      assistantReply
    );

    // Broadcast assistant message locally
    const assistantMsgPayload = {
      type: 'assistant_message',
      id: assistantMsg.id,
      conversation_id: conversationId,
      sender_id: userId,
      role: 'assistant',
      content: assistantMsg.content,
      timestamp: assistantMsg.created_at,
    };

    connectionManager.broadcast(conversationId, JSON.stringify(assistantMsgPayload));

    // Publish to Redis
    await redisManager.publish(channel, JSON.stringify(assistantMsgPayload));

    logger.info('Message processed', {
      userId,
      conversationId,
      messageId: userMessage.id,
    });
  }

  private static generateMockReply(userMessage: string): string {
    const replies = [
      `You said: "${userMessage}" - I'm a mock assistant, so here's an echo!`,
      `Echo: ${userMessage}`,
      `That's interesting! You mentioned: ${userMessage}`,
      `I heard you say: "${userMessage}" - What would you like to do next?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  static async handleConnection(
    ws: WebSocket,
    userId: string,
    conversationId: string
  ): Promise<void> {
    // Verify conversation exists and user has access
    const conversation = await ConversationRepository.getConversationById(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    // Create connection record
    const connection = {
      ws,
      userId,
      conversationId,
      isAlive: true,
    };

    connectionManager.addConnection(conversationId, connection);

    // Subscribe to Redis channel for this conversation
    const channel = redisManager.getConversationChannel(conversationId);
    await redisManager.subscribe(channel, (message) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    // Fetch and send message history
    const messages = await MessageRepository.getMessagesByConversationId(conversationId, 50, 0);
    ws.send(
      JSON.stringify({
        type: 'history',
        messages,
      })
    );

    logger.info('WebSocket connection established', { userId, conversationId });
  }

  static handleDisconnection(userId: string, conversationId: string): void {
    const connections = connectionManager.getConversationConnections(conversationId);
    const connection = connections.find((c) => c.userId === userId);

    if (connection) {
      connectionManager.removeConnection(conversationId, connection);
      logger.info('WebSocket disconnected', { userId, conversationId });
    }
  }
}
