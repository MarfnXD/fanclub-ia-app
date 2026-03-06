'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { SkillResponse } from '@/lib/types';

export function useSkill() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SkillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (skill: string, message: string, userId: string) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.skill({ skill, message, user_id: userId });
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
  }, []);

  return { execute, isLoading, result, error, reset };
}
