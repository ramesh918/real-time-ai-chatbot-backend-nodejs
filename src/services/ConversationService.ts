import { ConversationRepository } from '../repositories/ConversationRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { Conversation, Message } from '../models/types';

export class ConversationService {
  static async createConversation(userId: string, name: string): Promise<Conversation> {
    return ConversationRepository.createConversation(userId, name);
  }

  static async getConversations(userId: string, limit?: number, offset?: number): Promise<Conversation[]> {
    return ConversationRepository.getConversationsByUserId(userId, limit, offset);
  }

  static async getConversation(conversationId: string): Promise<Conversation | null> {
    return ConversationRepository.getConversationById(conversationId);
  }

  static async getConversationMessages(
    conversationId: string,
    limit?: number,
    offset?: number
  ): Promise<{ messages: Message[]; total: number }> {
    const [messages, total] = await Promise.all([
      MessageRepository.getMessagesByConversationId(conversationId, limit, offset),
      MessageRepository.getMessageCount(conversationId),
    ]);
    return { messages, total };
  }

  static async updateConversation(conversationId: string, name: string): Promise<Conversation | null> {
    return ConversationRepository.updateConversation(conversationId, name);
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    return ConversationRepository.deleteConversation(conversationId);
  }
}
