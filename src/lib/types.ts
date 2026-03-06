export interface ChatRequest {
  message: string;
  user_id?: string;
  level?: 'massa' | 'power' | 'admin';
  model?: string | null;
  conversation_history?: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  model_used: string;
  tokens_used: {
    input: number;
    output: number;
  };
}

export interface SkillRequest {
  skill: string;
  message: string;
  user_id?: string;
  model?: string | null;
  conversation_history?: ConversationMessage[];
}

export interface SkillResponse {
  response: string;
  model_used: string;
  file_url?: string;
  tokens_used: {
    input: number;
    output: number;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface SkillsResponse {
  skills: Record<string, string>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model_used?: string;
  tokens_used?: { input: number; output: number };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type UserLevel = 'massa' | 'power' | 'admin';

export interface UserState {
  id: string;
  level: UserLevel;
}

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  route?: string;
}

export interface SkillOutput {
  id: string;
  user_id: string;
  skill: string;
  title: string;
  file_path: string;
  file_url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OutputsResponse {
  outputs: SkillOutput[];
}
