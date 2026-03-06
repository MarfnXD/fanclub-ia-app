'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { SkillResponse, ConversationMessage } from '@/lib/types';

export function useSkill() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SkillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iteration, setIteration] = useState(0);
  const historyRef = useRef<ConversationMessage[]>([]);

  const execute = useCallback(async (skill: string, message: string, userId: string) => {
    setIsLoading(true);
    setError(null);
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro na execução';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIteration(0);
    historyRef.current = [];
  }, []);

  return { execute, isLoading, result, error, reset, iteration };
}
