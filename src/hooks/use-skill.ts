'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { SkillResponse, ConversationMessage } from '@/lib/types';

export function useSkill() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SkillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iteration, setIteration] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [chatText, setChatText] = useState('');
  const [contentText, setContentText] = useState('');
  const historyRef = useRef<ConversationMessage[]>([]);
  const accumulatedRef = useRef('');

  const execute = useCallback(async (skill: string, message: string, userId: string, preset?: string, customTokens?: Record<string, unknown> | null) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep(null);
    setStreamingText('');
    setChatText('');
    setContentText('');
    accumulatedRef.current = '';

    try {
      let finalResult: SkillResponse | null = null;

      await api.skillStream(
        {
          skill,
          message,
          user_id: userId,
          conversation_history: historyRef.current,
          preset,
          custom_tokens: customTokens,
        },
        {
          onChunk: (text) => {
            accumulatedRef.current += text;
            setStreamingText(accumulatedRef.current);
          },
          onChat: (text) => {
            setChatText(text);
          },
          onContent: (text) => {
            setContentText(text);
          },
          onStep: (step) => {
            setCurrentStep(step);
          },
          onFile: (url) => {
            setResult((prev) => prev ? { ...prev, file_url: url } : {
              response: accumulatedRef.current,
              model_used: '',
              tokens_used: { input: 0, output: 0 },
              file_url: url,
            });
          },
          onDone: (meta) => {
            setCurrentStep(null);
            finalResult = {
              response: accumulatedRef.current,
              model_used: meta.model_used,
              tokens_used: meta.tokens_used || { input: 0, output: 0 },
              file_url: meta.file_url,
            };
            setResult(finalResult);
            setStreamingText('');
          },
        }
      );

      if (finalResult) {
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: message },
          { role: 'assistant', content: (finalResult as SkillResponse).response },
        ];
        setIteration((n) => n + 1);
      }

      return finalResult;
    } catch {
      try {
        const res = await api.skill({
          skill,
          message,
          user_id: userId,
          conversation_history: historyRef.current,
          preset,
          custom_tokens: customTokens,
        });

        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: message },
          { role: 'assistant', content: res.response },
        ];

        setIteration((n) => n + 1);
        setResult(res);
        setContentText(res.response);
        return res;
      } catch (fallbackErr) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Erro na execucao';
        setError(msg);
        return null;
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  }, []);

  const updateLastResponse = useCallback((newContent: string) => {
    if (historyRef.current.length >= 2) {
      historyRef.current[historyRef.current.length - 1] = {
        role: 'assistant',
        content: newContent,
      };
    }
  }, []);

  const getConversationHistory = useCallback(() => {
    return historyRef.current;
  }, []);

  const restoreState = useCallback((data: {
    conversationHistory: ConversationMessage[];
    iteration: number;
    fileUrl?: string | null;
    modelUsed?: string | null;
    response?: string;
  }) => {
    historyRef.current = data.conversationHistory;
    setIteration(data.iteration);
    if (data.fileUrl) {
      setResult({
        response: data.response || '',
        model_used: data.modelUsed || '',
        tokens_used: { input: 0, output: 0 },
        file_url: data.fileUrl,
      });
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIteration(0);
    setCurrentStep(null);
    setStreamingText('');
    setChatText('');
    setContentText('');
    historyRef.current = [];
  }, []);

  return {
    execute, isLoading, result, setResult, error, reset, iteration, currentStep,
    updateLastResponse, streamingText, chatText, contentText,
    getConversationHistory, restoreState,
  };
}
