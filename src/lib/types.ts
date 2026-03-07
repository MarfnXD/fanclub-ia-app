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
  preset?: string;
  custom_tokens?: Record<string, unknown> | null;
}

export interface DesignTokens {
  colors: {
    primary: string;
    'primary-light': string;
    'primary-lighter': string;
    'primary-dark': string;
    'primary-darker': string;
    'primary-glow': string;
    'primary-border': string;
    accent: string;
    'accent-glow': string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  logo_url?: string;
  background_color?: string;
}

export interface PresetInfo {
  id: string;
  name: string;
  colors: DesignTokens['colors'];
  fonts: DesignTokens['fonts'];
  radius: DesignTokens['radius'];
  custom?: boolean;
  db_id?: string;
  brand_name?: string;
  personality?: string;
  logo_url?: string;
  background_color?: string;
  pinned?: boolean;
  sort_order?: number;
}

export interface PresetsResponse {
  presets: PresetInfo[];
}

export interface BrandAnalysis {
  brand_name: string;
  colors: DesignTokens['colors'];
  fonts: DesignTokens['fonts'];
  style: string;
  personality: string;
  font_imports: string;
  background_color?: string;
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

export interface SkillSession {
  id: string;
  user_id: string;
  skill: string;
  title: string;
  chat_messages: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
  conversation_history: ConversationMessage[];
  file_url: string | null;
  editor_content: string | null;
  model_used: string | null;
  iteration: number;
  created_at: string;
  updated_at: string;
}

export interface SessionsResponse {
  sessions: SkillSession[];
}

// Pipeline Multi-Step (Slides)
export interface SlidesPlanSlide {
  number: number;
  type: 'cover' | 'content' | 'section_break' | 'end';
  label: string | null;
  title: string;
  subtitle: string | null;
  content: string[];
  content_type: string;
  notes: string;
  // Step 2 fields
  component?: string | null;
  secondary_component?: string | null;
  icons?: string[];
  chart?: { type: string; description: string; data_from_content?: boolean } | null;
  design_notes?: string | null;
  layout_hint?: string | null;
}

export interface SlidesPlanMeta {
  title: string;
  subtitle: string;
  badge: string;
  total_slides: number;
  curation_mode: boolean;
  curation_notes?: string;
}

export interface SlidesPlan {
  meta: SlidesPlanMeta;
  slides: SlidesPlanSlide[];
}

export interface SlidesStepRequest {
  step: 1 | 2 | 3;
  message?: string;
  plan_json?: SlidesPlan;
  curation_mode?: boolean;
  user_id?: string;
  model?: string | null;
  preset?: string;
  custom_tokens?: Record<string, unknown> | null;
}

export interface SlidesStepResponse {
  step: number;
  plan: SlidesPlan;
  model_used: string;
  tokens_used: { input: number; output: number };
}
