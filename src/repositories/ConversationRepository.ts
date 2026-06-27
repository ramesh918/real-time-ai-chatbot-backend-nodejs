import { query } from '../utils/db';
import { Conversation } from '../models/types';

export class ConversationRepository {
  static async createConversation(userId: string, name: string): Promise<Conversation> {
    const result = await query(
      `INSERT INTO conversations (user_id, name)
       VALUES ($1, $2)
       RETURNING id, user_id, name, created_at, updated_at`,
      [userId, name]
    );
    return result.rows[0];
  }

  static async getConversationById(id: string): Promise<Conversation | null> {
    const result = await query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getConversationsByUserId(userId: string, limit = 20, offset = 0): Promise<Conversation[]> {
    const result = await query(
      `SELECT * FROM conversations WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async updateConversation(id: string, name: string): Promise<Conversation | null> {
    const result = await query(
      `UPDATE conversations SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, user_id, name, created_at, updated_at`,
      [name, id]
    );
    return result.rows[0] || null;
  }

  static async deleteConversation(id: string): Promise<boolean> {
    const result = await query('DELETE FROM conversations WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}
