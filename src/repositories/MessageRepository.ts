import { query } from '../utils/db';
import { Message } from '../models/types';

export class MessageRepository {
  static async createMessage(
    conversationId: string,
    senderId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<Message> {
    const result = await query(
      `INSERT INTO messages (conversation_id, sender_id, role, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, role, content, created_at`,
      [conversationId, senderId, role, content]
    );
    return result.rows[0];
  }

  static async getMessagesByConversationId(
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<Message[]> {
    const result = await query(
      `SELECT * FROM messages WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset]
    );
    return result.rows;
  }

  static async getMessageCount(conversationId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [conversationId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}
