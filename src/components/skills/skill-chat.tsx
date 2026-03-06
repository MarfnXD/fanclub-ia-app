'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Loader2, RotateCcw, Pencil, Paperclip, X, FileText,
  Send, PanelRightClose, PanelRightOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AttachedFile {
  name: string;
  text: string;
  charCount: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SkillChatProps {
  skillName: string;
  placeholder?: string;
  isLoading: boolean;
  currentStep: string | null;
  error: string | null;
  iteration: number;
  messages: ChatMessage[];
  streamingText?: string;
  editorContent?: string;
  contentEdited?: boolean;
  onExecute: (message: string) => void;
  onReset: () => void;
}

const ACCEPTED = '.txt,.md,.pdf';

export function SkillChat({
  skillName,
  placeholder,
  isLoading,
  currentStep,
  error,
  iteration,
  messages,
  streamingText,
  editorContent,
  contentEdited,
  onExecute,
  onReset,
}: SkillChatProps) {
  const [prompt, setPrompt] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['txt', 'md', 'pdf'].includes(ext)) return;
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setAttachedFiles(prev => [...prev, {
        name: res.filename,
        text: res.text,
        charCount: res.char_count,
      }]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await processFile(file);
    }
    e.target.value = '';
  }, [processFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      await processFile(file);
    }
  }, [processFile]);

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    let fullMessage = '';
    for (const file of attachedFiles) {
      fullMessage += `[DOCUMENTO ANEXADO: ${file.name}]\n${file.text}\n\n`;
    }
    if (contentEdited && editorContent) {
      fullMessage += `[CONTEUDO ATUAL DO DOCUMENTO — editado pelo usuario]\n${editorContent}\n\n[INSTRUCAO DO USUARIO]\n`;
    }
    fullMessage += prompt.trim();

    onExecute(fullMessage);
    setPrompt('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{skillName}</h3>
          <div className="flex items-center gap-2">
            {iteration > 0 && (
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                v{iteration}
              </span>
            )}
            {iteration > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onReset} title="Comecar do zero">
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        <div className="py-3 space-y-3">
          {messages.map((msg, i) => {
            const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
            const showStreaming = isLastAssistant && isLoading && streamingText;

            // During streaming, only show text from [CONVERSA] sections
            let displayText = msg.content;
            if (showStreaming) {
              const parts = (streamingText || '').split(/\[CONTEUDO\]/);
              const conversaPart = parts[0] || '';
              displayText = conversaPart.replace(/\[CONVERSA\]/g, '').trim();
            }

            // Parse [ACOES: ...] from text
            const acoesMatch = displayText.match(/\[ACOES:\s*([^\]]+)\]/);
            const actions = acoesMatch
              ? acoesMatch[1].split('|').map(a => a.trim()).filter(Boolean)
              : [];
            const textWithoutActions = displayText.replace(/\[ACOES:\s*[^\]]+\]/g, '').trim();

            // Skip empty assistant placeholders when not streaming
            if (msg.role === 'assistant' && !textWithoutActions && !showStreaming && actions.length === 0) return null;

            return (
              <div key={i} className="space-y-2">
                {/* Message bubble */}
                {textWithoutActions && (
                  <div
                    className={cn(
                      'text-xs leading-relaxed rounded-lg px-3 py-2',
                      msg.role === 'user'
                        ? 'bg-primary/10 text-primary ml-6'
                        : 'bg-secondary text-gray-300 mr-2'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{
                      msg.role === 'user' && textWithoutActions.length > 300
                        ? textWithoutActions.slice(0, 300) + '...'
                        : textWithoutActions
                    }</p>
                    {showStreaming && (
                      <span className="inline-block w-1.5 h-3 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                )}

                {/* Action buttons */}
                {actions.length > 0 && !isLoading && isLastAssistant && (
                  <div className="flex flex-wrap gap-1.5 mr-2">
                    {actions.map((action, ai) => (
                      <button
                        key={ai}
                        onClick={() => onExecute(action)}
                        className={cn(
                          'text-[11px] px-2.5 py-1.5 rounded-md border transition-colors',
                          ai === 0
                            ? 'bg-primary/15 border-primary/30 text-primary hover:bg-primary/25'
                            : 'bg-secondary/50 border-border text-gray-300 hover:bg-secondary hover:text-white'
                        )}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && currentStep && (
            <div className="flex items-center gap-2 text-xs text-primary animate-pulse px-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div
        className={cn(
          'border-t border-border p-3 space-y-2',
          dragOver && 'ring-2 ring-primary ring-inset bg-primary/5'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 bg-[#1E1E21] border border-border rounded text-[10px] text-muted-foreground"
              >
                <FileText className="w-2.5 h-2.5 text-primary" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <button onClick={() => removeFile(i)} className="hover:text-white">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {contentEdited && (
          <div className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded">
            Conteudo editado — suas alteracoes serao enviadas
          </div>
        )}

        <div className="flex gap-1.5 items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
            title="Anexar arquivo"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          </Button>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              iteration > 0
                ? 'Ajuste ou diga "gera"...'
                : placeholder || `Descreva o que quer...`
            }
            rows={2}
            className="bg-[#121214] border-border text-xs resize-none min-h-[40px] focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={(!prompt.trim() && attachedFiles.length === 0) || isLoading}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded pointer-events-none">
            <p className="text-primary text-xs font-medium">Solte o arquivo aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
