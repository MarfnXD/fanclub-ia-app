'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import type { Conversation, Message } from '@/lib/types';
import {
  getConversations,
  saveConversations,
  getActiveConversationId,
  setActiveConversationId,
} from '@/lib/storage';

interface ConversationsContextValue {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeId: string | null;
  createConversation: () => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateLastMessage: (conversationId: string, message: Message) => void;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function useConversationsContext() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error('useConversationsContext must be used within ConversationsProvider');
  return ctx;
}

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setConversations(getConversations());
    setActiveId(getActiveConversationId());
  }, []);

  const persist = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations((prev) => {
      const next = updater(prev);
      saveConversations(next);
      return next;
    });
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
    persist((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    setActiveConversationId(conv.id);
    return conv;
  }, [persist]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      persist((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        if (activeId === id) {
          const next = updated[0]?.id || null;
          setActiveId(next);
          setActiveConversationId(next);
        }
        return updated;
      });
    },
    [activeId, persist]
  );

  const addMessage = useCallback(
    (conversationId: string, message: Message) => {
      persist((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const messages = [...c.messages, message];
          const title =
            c.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 60)
              : c.title;
          return { ...c, messages, title, updatedAt: Date.now() };
        })
      );
    },
    [persist]
  );

  const updateLastMessage = useCallback(
    (conversationId: string, message: Message) => {
      persist((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const messages = [...c.messages.slice(0, -1), message];
          return { ...c, messages, updatedAt: Date.now() };
        })
      );
    },
    [persist]
  );

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        activeConversation,
        activeId,
        createConversation,
        selectConversation,
        deleteConversation,
        addMessage,
        updateLastMessage,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}
