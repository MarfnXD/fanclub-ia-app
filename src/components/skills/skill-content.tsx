'use client';

import { useState } from 'react';
import { Eye, PenLine, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface SkillContentProps {
  content: string;
  editMode: boolean;
  contentEdited: boolean;
  hasFile: boolean;
  isLoading: boolean;
  onContentChange: (value: string) => void;
  onToggleEditMode: (mode: boolean) => void;
  renderFile?: React.ReactNode;
}

export function SkillContent({
  content,
  editMode,
  contentEdited,
  hasFile,
  isLoading,
  onContentChange,
  onToggleEditMode,
  renderFile,
}: SkillContentProps) {
  // Empty state
  if (!content && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <Sparkles className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm">O conteudo produzido aparece aqui</p>
          <p className="text-xs opacity-60">Use o chat ao lado para comecar</p>
        </div>
      </div>
    );
  }

  // File result (slides preview, etc.)
  if (hasFile && renderFile) {
    return <div className="h-full overflow-hidden">{renderFile}</div>;
  }

  // Text content with editor
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#0F0F11]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Conteudo</span>
          {contentEdited && (
            <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              <Check className="w-2.5 h-2.5" />
              Editado
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleEditMode(false)}
            className={cn(
              'p-1.5 rounded text-xs flex items-center gap-1 transition-colors',
              !editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
            )}
            title="Visualizar"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Visualizar</span>
          </button>
          <button
            onClick={() => onToggleEditMode(true)}
            className={cn(
              'p-1.5 rounded text-xs flex items-center gap-1 transition-colors',
              editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
            )}
            title="Editar"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {editMode ? (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full p-6 bg-transparent text-sm text-gray-200 font-mono leading-relaxed resize-none outline-none"
            spellCheck={false}
          />
        ) : (
          <div className="p-6 markdown-content text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
