'use client';

import { useState, useCallback, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import type { Conversation, Message } from '@/lib/types';
import {
  getConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
} from '@/lib/storage';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setConversations(getConversations());
    setActiveId(getActiveConversationId());
  }, []);

  const persist = useCallback((convs: Conversation[]) => {
    setConversations(convs);
    saveConversations(convs);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  const createConversation = useCallback((): Conversation => {
    const conv: Conversation = {
      id: uuid(),
      title: 'Nova conversa',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [conv, ...conversations];
    persist(updated);
    setActiveId(conv.id);
    setActiveConversationId(conv.id);
    return conv;
  }, [conversations, persist]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const updated = conversations.filter((c) => c.id !== id);
      persist(updated);
      if (activeId === id) {
        const next = updated[0]?.id || null;
        setActiveId(next);
        setActiveConversationId(next);
      }
    },
    [conversations, activeId, persist]
  );

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages, message];
        const title =
          c.messages.length === 0 && message.role === 'user'
            ? message.content.slice(0, 60)
            : c.title;
        return { ...c, messages, title, updatedAt: Date.now() };
      });
      persist(updated);
    },
    [conversations, persist]
  );

  const updateLastMessage = useCallback(
    (conversationId: string, message: Message) => {
      const updated = conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages.slice(0, -1), message];
        return { ...c, messages, updatedAt: Date.now() };
      });
      persist(updated);
    },
    [conversations, persist]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateLastMessage,
  };
}
