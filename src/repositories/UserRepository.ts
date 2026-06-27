import { query } from '../utils/db';
import { User } from '../models/types';

export class UserRepository {
  static async createUser(email: string, passwordHash: string): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, created_at, updated_at`,
      [email, passwordHash]
    );
    return result.rows[0];
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getUserByIdSafe(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const result = await query(
      'SELECT id, email, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
}
