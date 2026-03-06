'use client';

import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { api } from '@/lib/api';
import type { Message, UserLevel, ConversationMessage } from '@/lib/types';

interface UseChatOptions {
  userId: string;
  level: UserLevel;
  onAddMessage: (conversationId: string, message: Message) => void;
  onUpdateLastMessage: (conversationId: string, message: Message) => void;
}

export function useChat({ userId, level, onAddMessage, onUpdateLastMessage }: UseChatOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (conversationId: string, content: string, history: Message[]) => {
      const userMsg: Message = {
        id: uuid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      onAddMessage(conversationId, userMsg);

      const placeholderMsg: Message = {
        id: uuid(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      onAddMessage(conversationId, placeholderMsg);

      setIsLoading(true);
      try {
        const conversationHistory: ConversationMessage[] = history.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        conversationHistory.push({ role: 'user', content });

        const res = await api.chat({
          message: content,
          user_id: userId,
          level,
          conversation_history: conversationHistory,
        });

        const assistantMsg: Message = {
          ...placeholderMsg,
          content: res.response,
          model_used: res.model_used,
          tokens_used: res.tokens_used,
        };
        onUpdateLastMessage(conversationId, assistantMsg);
      } catch (err) {
        const errorMsg: Message = {
          ...placeholderMsg,
          content: `Erro: ${err instanceof Error ? err.message : 'Falha na comunicação'}`,
        };
        onUpdateLastMessage(conversationId, errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, level, onAddMessage, onUpdateLastMessage]
  );

  return { sendMessage, isLoading };
}
