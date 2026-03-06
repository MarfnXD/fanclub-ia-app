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
  const historyRef = useRef<ConversationMessage[]>([]);
  const accumulatedRef = useRef('');

  const execute = useCallback(async (skill: string, message: string, userId: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep(null);
    accumulatedRef.current = '';

    try {
      let finalResult: SkillResponse | null = null;

      await api.skillStream(
        {
          skill,
          message,
          user_id: userId,
          conversation_history: historyRef.current,
        },
        {
          onChunk: (text) => {
            accumulatedRef.current += text;
            setResult((prev) => ({
              response: accumulatedRef.current,
              model_used: prev?.model_used || '',
              tokens_used: prev?.tokens_used || { input: 0, output: 0 },
              file_url: prev?.file_url,
            }));
          },
          onStep: (step) => {
            setCurrentStep(step);
          },
          onFile: (url) => {
            setResult((prev) => prev ? { ...prev, file_url: url } : null);
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
      // Fallback: tenta endpoint não-streaming
      try {
        const res = await api.skill({
          skill,
          message,
          user_id: userId,
          conversation_history: historyRef.current,
        });

        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: message },
          { role: 'assistant', content: res.response },
        ];

        setIteration((n) => n + 1);
        setResult(res);
        return res;
      } catch (fallbackErr) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Erro na execução';
        setError(msg);
        return null;
      }
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIteration(0);
    setCurrentStep(null);
    historyRef.current = [];
  }, []);

  return { execute, isLoading, result, error, reset, iteration, currentStep };
}
