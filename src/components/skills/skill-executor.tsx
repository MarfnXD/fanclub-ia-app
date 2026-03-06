'use client';

import { useState } from 'react';
import { Play, Loader2, RotateCcw, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSkill } from '@/hooks/use-skill';
import { useUser } from '@/providers/user-provider';

interface SkillExecutorProps {
  skillId: string;
  skillName: string;
  placeholder?: string;
  renderResult?: (result: { response: string; file_url?: string }) => React.ReactNode;
}

export function SkillExecutor({
  skillId,
  skillName,
  placeholder,
  renderResult,
}: SkillExecutorProps) {
  const [prompt, setPrompt] = useState('');
  const { execute, isLoading, result, error, reset, iteration } = useSkill();
  const user = useUser();

  const handleExecute = () => {
    if (!prompt.trim()) return;
    execute(skillId, prompt.trim(), user.id);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            iteration > 0
              ? 'Peça um ajuste... Ex: "troca o slide 3 por um timeline", "adiciona mais um slide de cases"'
              : placeholder || `Descreva o que deseja para o skill ${skillName}...`
          }
          rows={iteration > 0 ? 2 : 4}
          className="bg-[#121214] border-border focus-visible:ring-primary resize-none"
          disabled={isLoading}
        />
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleExecute}
            disabled={!prompt.trim() || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : iteration > 0 ? (
              <Pencil className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Gerando...' : iteration > 0 ? 'Refinar' : 'Executar'}
          </Button>
          {result && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Começar do zero
            </Button>
          )}
          {iteration > 0 && (
            <span className="text-xs text-muted-foreground">
              Iteração {iteration}
            </span>
          )}
        </div>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/30 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          {renderResult ? (
            renderResult(result)
          ) : (
            <Card className="bg-[#121214] border-border p-4">
              <div className="markdown-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.response}</ReactMarkdown>
              </div>
            </Card>
          )}
          {result.model_used && (
            <p className="text-xs text-muted-foreground font-mono">
              Modelo: {result.model_used}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
