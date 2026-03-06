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
}

export const api = new ApiClient();
