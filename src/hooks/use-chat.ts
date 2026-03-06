'use client';

import { useState, useCallback, useRef } from 'react';
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
  const accumulatedRef = useRef('');

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
      accumulatedRef.current = '';

      try {
        const conversationHistory: ConversationMessage[] = history.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        conversationHistory.push({ role: 'user', content });

        const requestData = {
          message: content,
          user_id: userId,
          level,
          conversation_history: conversationHistory,
        };

        await api.chatStream(
          requestData,
          (chunk) => {
            accumulatedRef.current += chunk;
            onUpdateLastMessage(conversationId, {
              ...placeholderMsg,
              content: accumulatedRef.current,
            });
          },
          (meta) => {
            onUpdateLastMessage(conversationId, {
              ...placeholderMsg,
              content: accumulatedRef.current,
              model_used: meta.model_used,
              tokens_used: meta.tokens_used,
            });
          }
        );
      } catch {
        // Fallback: tenta endpoint não-streaming
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

          onUpdateLastMessage(conversationId, {
            ...placeholderMsg,
            content: res.response,
            model_used: res.model_used,
            tokens_used: res.tokens_used,
          });
        } catch (fallbackErr) {
          onUpdateLastMessage(conversationId, {
            ...placeholderMsg,
            content: `Erro: ${fallbackErr instanceof Error ? fallbackErr.message : 'Falha na comunicação'}`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [userId, level, onAddMessage, onUpdateLastMessage]
  );

  return { sendMessage, isLoading };
}
