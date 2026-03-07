import { API_URL } from './constants';
import type {
  ChatRequest,
  ChatResponse,
  SkillRequest,
  SkillResponse,
  HealthResponse,
  SkillsResponse,
  OutputsResponse,
  SkillSession,
  SessionsResponse,
  PresetsResponse,
  BrandAnalysis,
  SlidesStepRequest,
  SlidesStepResponse,
} from './types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API Error ${res.status}: ${error}`);
    }
    return res.json();
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async chat(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async skill(data: SkillRequest): Promise<SkillResponse> {
    return this.request<SkillResponse>('/skill', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async agent(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/agent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async skills(): Promise<SkillsResponse> {
    return this.request<SkillsResponse>('/skills');
  }

  async presets(userId: string = 'anonymous'): Promise<PresetsResponse> {
    return this.request<PresetsResponse>(`/presets?user_id=${encodeURIComponent(userId)}`);
  }

  async saveCustomPreset(data: {
    user_id: string;
    name: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
    radius?: Record<string, string>;
    font_imports?: string;
    brand_name?: string;
    personality?: string;
    logo_url?: string;
    background_color?: string;
  }): Promise<{ preset: import('./types').PresetInfo }> {
    return this.request('/presets/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomPreset(dbId: string): Promise<{ ok: boolean }> {
    return this.request(`/presets/custom/${dbId}`, { method: 'DELETE' });
  }

  async togglePinPreset(dbId: string): Promise<{ ok: boolean; pinned: boolean }> {
    return this.request(`/presets/custom/${dbId}/pin`, { method: 'PATCH' });
  }

  async reorderPresets(presetIds: string[]): Promise<{ ok: boolean }> {
    return this.request('/presets/custom/reorder', {
      method: 'POST',
      body: JSON.stringify({ preset_ids: presetIds }),
    });
  }

  async rethemeSlides(data: {
    file_url: string;
    preset: string;
    custom_tokens?: Record<string, unknown> | null;
  }): Promise<{ file_url: string }> {
    return this.request('/slides/retheme', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/brand/upload-logo`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Logo Upload Error ${res.status}: ${error}`);
    }
    return res.json();
  }

  async analyzeBrand(file: File): Promise<{ tokens: BrandAnalysis }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/brand/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Brand Analysis Error ${res.status}: ${error}`);
    }
    return res.json();
  }

  async outputs(userId: string, skill?: string): Promise<OutputsResponse> {
    const params = new URLSearchParams({ user_id: userId });
    if (skill) params.set('skill', skill);
    return this.request<OutputsResponse>(`/outputs?${params.toString()}`);
  }

  fileUrl(filename: string): string {
    return `${this.baseUrl}/files/${filename}`;
  }

  private async readSSE(
    path: string,
    body: unknown,
    handlers: {
      onText?: (text: string) => void;
      onChat?: (text: string) => void;
      onContent?: (text: string) => void;
      onStep?: (step: string) => void;
      onFile?: (url: string) => void;
      onDone?: (meta: { model_used: string; file_url?: string; tokens_used?: { input: number; output: number } }) => void;
      onError?: (msg: string) => void;
    }
  ) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`API Error ${res.status}: ${error}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          switch (event.type) {
            case 'text':
              handlers.onText?.(event.content);
              break;
            case 'chat':
              handlers.onChat?.(event.content);
              break;
            case 'content':
              handlers.onContent?.(event.content);
              break;
            case 'step':
              handlers.onStep?.(event.step);
              break;
            case 'file':
              handlers.onFile?.(event.file_url);
              break;
            case 'done':
              handlers.onDone?.(event);
              break;
            case 'error':
              handlers.onError?.(event.message);
              break;
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }

  async chatStream(
    data: ChatRequest,
    onChunk: (text: string) => void,
    onDone: (meta: { model_used: string; tokens_used?: { input: number; output: number } }) => void
  ) {
    return this.readSSE('/chat/stream', data, {
      onText: onChunk,
      onDone,
      onError: (msg) => { throw new Error(msg); },
    });
  }

  async uploadFile(file: File): Promise<{ filename: string; extension: string; text: string; char_count: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Upload Error ${res.status}: ${error}`);
    }
    return res.json();
  }

  // Sessions
  async saveSession(data: Partial<SkillSession>): Promise<{ session: SkillSession }> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listSessions(userId: string, skill?: string): Promise<SessionsResponse> {
    const params = new URLSearchParams({ user_id: userId });
    if (skill) params.set('skill', skill);
    return this.request(`/sessions?${params.toString()}`);
  }

  async getSession(sessionId: string): Promise<{ session: SkillSession }> {
    return this.request(`/sessions/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<{ ok: boolean }> {
    return this.request(`/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // Pipeline multi-step para slides
  async slidesStep(data: SlidesStepRequest): Promise<SlidesStepResponse> {
    return this.request<SlidesStepResponse>('/skill/slides/step', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async slidesStepStream(
    data: SlidesStepRequest,
    handlers: {
      onChunk?: (text: string) => void;
      onStep?: (step: string) => void;
      onFile?: (url: string) => void;
      onDone?: (meta: { model_used: string; file_url?: string; tokens_used?: { input: number; output: number } }) => void;
    }
  ) {
    return this.readSSE('/skill/slides/step', data, {
      onText: handlers.onChunk,
      onStep: handlers.onStep,
      onFile: handlers.onFile,
      onDone: handlers.onDone,
      onError: (msg) => { throw new Error(msg); },
    });
  }

  async skillStream(
    data: SkillRequest,
    handlers: {
      onChunk?: (text: string) => void;
      onChat?: (text: string) => void;
      onContent?: (text: string) => void;
      onStep: (step: string) => void;
      onFile: (url: string) => void;
      onDone: (meta: { model_used: string; file_url?: string; tokens_used?: { input: number; output: number } }) => void;
    }
  ) {
    return this.readSSE('/skill/stream', data, {
      onText: handlers.onChunk,
      onChat: handlers.onChat,
      onContent: handlers.onContent,
      onStep: handlers.onStep,
      onFile: handlers.onFile,
      onDone: handlers.onDone,
      onError: (msg) => { throw new Error(msg); },
    });
  }
}

export const api = new ApiClient();
