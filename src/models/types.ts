export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSignupPayload {
  email: string;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export interface Conversation {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

export interface MessagePayload {
  content: string;
  conversation_id: string;
}

export interface WebSocketMessage {
  type: 'user_message' | 'assistant_message' | 'error' | 'heartbeat' | 'history';
  id?: string;
  conversation_id?: string;
  sender_id?: string;
  role?: string;
  content?: string;
  error?: string;
  messages?: Message[];
  timestamp?: Date;
}
