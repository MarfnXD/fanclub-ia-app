import { API_URL } from './constants';
import type {
  ChatRequest,
  ChatResponse,
  SkillRequest,
  SkillResponse,
  HealthResponse,
  SkillsResponse,
  OutputsResponse,
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

  async skillStream(
    data: SkillRequest,
    handlers: {
      onChunk: (text: string) => void;
      onStep: (step: string) => void;
      onFile: (url: string) => void;
      onDone: (meta: { model_used: string; file_url?: string; tokens_used?: { input: number; output: number } }) => void;
    }
  ) {
    return this.readSSE('/skill/stream', data, {
      onText: handlers.onChunk,
      onStep: handlers.onStep,
      onFile: handlers.onFile,
      onDone: handlers.onDone,
      onError: (msg) => { throw new Error(msg); },
    });
  }
}

export const api = new ApiClient();
