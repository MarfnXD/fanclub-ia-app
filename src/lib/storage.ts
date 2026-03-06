import type { Conversation, UserLevel } from './types';
import { MAX_CONVERSATIONS } from './constants';
import { v4 as uuid } from 'uuid';

const KEYS = {
  USER_ID: 'fanclub-ia-user-id',
  USER_LEVEL: 'fanclub-ia-user-level',
  CONVERSATIONS: 'fanclub-ia-conversations',
  ACTIVE_CONVERSATION: 'fanclub-ia-active-conversation',
};

// User
export function getUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  let id = localStorage.getItem(KEYS.USER_ID);
  if (!id) {
    id = uuid();
    localStorage.setItem(KEYS.USER_ID, id);
  }
  return id;
}

export function getUserLevel(): UserLevel {
  if (typeof window === 'undefined') return 'massa';
  return (localStorage.getItem(KEYS.USER_LEVEL) as UserLevel) || 'massa';
}

export function setUserLevel(level: UserLevel): void {
  localStorage.setItem(KEYS.USER_LEVEL, level);
}

// Conversations
export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEYS.CONVERSATIONS);
  return raw ? JSON.parse(raw) : [];
}

export function saveConversations(convs: Conversation[]): void {
  const trimmed = convs
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(trimmed));
}

export function getActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.ACTIVE_CONVERSATION);
}

export function setActiveConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(KEYS.ACTIVE_CONVERSATION, id);
  } else {
    localStorage.removeItem(KEYS.ACTIVE_CONVERSATION);
  }
}
