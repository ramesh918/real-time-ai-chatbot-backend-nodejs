import { createClient } from 'redis';
import { config } from '../config';
import logger from '../utils/logger';

export class RedisManager {
  private publisher = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    database: config.redis.db,
  });

  private subscriber = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    database: config.redis.db,
  });

  private messageHandlers: Map<string, (message: string) => void> = new Map();

  async connect(): Promise<void> {
    await this.publisher.connect();
    await this.subscriber.connect();
    logger.info('Redis connected');
  }

  async disconnect(): Promise<void> {
    await this.publisher.disconnect();
    await this.subscriber.disconnect();
    logger.info('Redis disconnected');
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.publisher.publish(channel, message);
    } catch (error) {
      logger.error('Redis publish error', { channel, error });
    }
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    this.messageHandlers.set(channel, handler);
    await this.subscriber.subscribe(channel, (message) => {
      handler(message);
    });
    logger.info('Redis subscribed', { channel });
  }

  async unsubscribe(channel: string): Promise<void> {
    this.messageHandlers.delete(channel);
    await this.subscriber.unsubscribe(channel);
    logger.info('Redis unsubscribed', { channel });
  }

  getConversationChannel(conversationId: string): string {
    return `conversation:${conversationId}`;
  }
}

export const redisManager = new RedisManager();
