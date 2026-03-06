'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Play, Loader2, RotateCcw, Pencil, Paperclip, X, FileText,
  Eye, PenLine, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSkill } from '@/hooks/use-skill';
import { useUser } from '@/providers/user-provider';
import { api } from '@/lib/api';

interface AttachedFile {
  name: string;
  text: string;
  charCount: number;
}

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor de conteudo ao vivo
  const [editorContent, setEditorContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [contentEdited, setContentEdited] = useState(false);
  const lastResponseRef = useRef('');

  const { execute, isLoading, result, error, reset, iteration, currentStep, updateLastResponse } = useSkill();
  const user = useUser();

  const ACCEPTED = '.txt,.md,.pdf';

  // Quando result muda (streaming ou final), atualiza editor se nao foi editado manualmente
  useEffect(() => {
    if (result?.response && !contentEdited) {
      setEditorContent(result.response);
      lastResponseRef.current = result.response;
    }
  }, [result?.response, contentEdited]);

  // Detecta se tem file (slides gerados) — nesse caso, mostra o renderResult, nao o editor
  const hasFile = result?.file_url;
  const showEditor = result && !hasFile && !isLoading && iteration > 0;

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    if (value !== lastResponseRef.current) {
      setContentEdited(true);
      updateLastResponse(value);
    } else {
      setContentEdited(false);
    }
  };

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

  const handleExecute = () => {
    if (!prompt.trim() && attachedFiles.length === 0) return;

    let fullMessage = '';

    // Anexos
    for (const file of attachedFiles) {
      fullMessage += `[DOCUMENTO ANEXADO: ${file.name}]\n${file.text}\n\n`;
    }

    // Se o conteudo foi editado, inclui o estado atual
    if (contentEdited && editorContent) {
      fullMessage += `[CONTEUDO ATUAL DO DOCUMENTO — editado pelo usuario]\n${editorContent}\n\n[INSTRUCAO DO USUARIO]\n`;
    }

    fullMessage += prompt.trim();

    execute(skillId, fullMessage, user.id);
    setPrompt('');
    setAttachedFiles([]);
    setContentEdited(false);
    setEditMode(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleReset = () => {
    reset();
    setAttachedFiles([]);
    setEditorContent('');
    setEditMode(false);
    setContentEdited(false);
    lastResponseRef.current = '';
  };

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="space-y-2">
        <div
          className={`relative rounded-lg transition-colors ${
            dragOver ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              iteration > 0
                ? 'Peca um ajuste, ou edite o conteudo acima diretamente...'
                : placeholder || `Descreva o que deseja para o skill ${skillName}...`
            }
            rows={iteration > 0 ? 2 : 4}
            className="bg-[#121214] border-border focus-visible:ring-primary resize-none"
            disabled={isLoading}
          />
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-dashed border-primary pointer-events-none">
              <p className="text-primary font-medium">Solte o arquivo aqui</p>
            </div>
          )}
        </div>

        {/* Attached files chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E1E21] border border-border rounded-md text-xs text-muted-foreground"
              >
                <FileText className="w-3 h-3 text-primary" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-[10px] opacity-60">
                  {file.charCount > 1000 ? `${(file.charCount / 1000).toFixed(1)}k` : file.charCount} chars
                </span>
                <button onClick={() => removeFile(i)} className="ml-0.5 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || uploading}
            title="Anexar arquivo (txt, md, pdf)"
            className="shrink-0"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={handleExecute}
            disabled={(!prompt.trim() && attachedFiles.length === 0) || isLoading}
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
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Comecar do zero
            </Button>
          )}
          {iteration > 0 && (
            <span className="text-xs text-muted-foreground">
              Iteracao {iteration}
            </span>
          )}
        </div>
      </div>

      {/* Loading step */}
      {isLoading && currentStep && (
        <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{currentStep}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/30 p-4">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Result area */}
      {result && (
        <div className="space-y-4">
          {/* Se tem file (slides), usa renderResult customizado */}
          {hasFile && renderResult ? (
            renderResult(result)
          ) : (
            /* Editor de conteudo ao vivo */
            <Card className="bg-[#121214] border-border overflow-hidden">
              {/* Toolbar do editor */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-[#1A1A1D]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    {hasFile ? 'Resultado' : 'Conteudo'}
                  </span>
                  {contentEdited && (
                    <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <Check className="w-2.5 h-2.5" />
                      Editado
                    </span>
                  )}
                </div>
                {!hasFile && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditMode(false)}
                      className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
                        !editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Visualizar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditMode(true)}
                      className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
                        editMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
                      }`}
                      title="Editar"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Conteudo */}
              <div className="p-4">
                {editMode && !hasFile ? (
                  <textarea
                    value={editorContent}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    className="w-full min-h-[300px] bg-transparent text-sm text-gray-200 font-mono leading-relaxed resize-y outline-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="markdown-content text-sm max-h-[500px] overflow-y-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editorContent || result.response}
                    </ReactMarkdown>
                  </div>
                )}
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
