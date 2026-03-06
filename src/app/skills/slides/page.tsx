'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  PanelRightClose, PanelRightOpen, FileText, Plus, Trash2, Clock, ExternalLink, Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { SkillChat } from '@/components/skills/skill-chat';
import { SkillContent } from '@/components/skills/skill-content';
import { SlidesPreview } from '@/components/skills/slides-preview';
import { ThemeEditor } from '@/components/skills/theme-editor';
import { UserProvider } from '@/providers/user-provider';
import { ConversationsProvider } from '@/providers/conversations-provider';
import { Button } from '@/components/ui/button';
import { useSkill } from '@/hooks/use-skill';
import { useUser } from '@/providers/user-provider';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { SkillSession, SkillOutput, PresetInfo, DesignTokens } from '@/lib/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function SlidesWorkspace() {
  const user = useUser();
  const {
    execute, isLoading, result, setResult, error, reset, iteration, currentStep,
    updateLastResponse, streamingText, chatText, contentText,
    getConversationHistory, restoreState,
  } = useSkill();

  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('slides-chat-open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [editorContent, setEditorContent] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [contentEdited, setContentEdited] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const lastContentRef = useRef('');

  // Previous outputs (arquivos HTML gerados)
  const [outputs, setOutputs] = useState<SkillOutput[]>([]);

  // Presets de estilo
  const [presets, setPresets] = useState<PresetInfo[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [customTokens, setCustomTokens] = useState<Partial<DesignTokens> | null>(null);

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('slides-active-session');
    }
    return null;
  });
  const [sessions, setSessions] = useState<Partial<SkillSession>[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load session list + outputs + restore active session
  useEffect(() => {
    const savedSessionId = localStorage.getItem('slides-active-session');

    Promise.all([
      api.listSessions(user.id, 'slides').catch(() => ({ sessions: [] as Partial<SkillSession>[] })),
      api.outputs(user.id, 'slides').catch(() => ({ outputs: [] as SkillOutput[] })),
      savedSessionId
        ? api.getSession(savedSessionId).catch(() => null)
        : Promise.resolve(null),
      api.presets(user.id).catch(() => ({ presets: [] as PresetInfo[] })),
    ]).then(([sessionsRes, outputsRes, sessionRes, presetsRes]) => {
      setSessions(sessionsRes.sessions);
      setOutputs(outputsRes.outputs);
      setPresets(presetsRes.presets);

      // Restore active session if found
      if (sessionRes && sessionRes.session) {
        const session = sessionRes.session;
        setChatMessages(session.chat_messages || []);
        setEditorContent(session.editor_content || '');
        lastContentRef.current = session.editor_content || '';
        restoreState({
          conversationHistory: session.conversation_history || [],
          iteration: session.iteration,
          fileUrl: session.file_url,
          modelUsed: session.model_used,
          response: session.editor_content || '',
        });
      } else if (savedSessionId) {
        // Session not found, clear stale ref
        setSessionId(null);
        localStorage.removeItem('slides-active-session');
      }

      setInitialLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Auto-save session after AI response
  const saveSession = useCallback(() => {
    if (chatMessages.length === 0) return;

    // Generate title from first user message
    const firstUser = chatMessages.find(m => m.role === 'user');
    const title = firstUser
      ? firstUser.content.slice(0, 80).replace(/\[DOCUMENTO.*?\]/g, '').trim() || 'Sem titulo'
      : 'Sem titulo';

    const data = {
      id: sessionId || undefined,
      user_id: user.id,
      skill: 'slides',
      title,
      chat_messages: chatMessages,
      conversation_history: getConversationHistory(),
      file_url: result?.file_url || null,
      editor_content: editorContent || null,
      model_used: result?.model_used || null,
      iteration,
    };

    api.saveSession(data)
      .then(({ session }) => {
        if (session && !sessionId) {
          setSessionId(session.id);
          localStorage.setItem('slides-active-session', session.id);
        }
        // Refresh session list
        api.listSessions(user.id, 'slides')
          .then((res) => setSessions(res.sessions))
          .catch(() => {});
      })
      .catch(() => {});
  }, [chatMessages, sessionId, user.id, getConversationHistory, result, editorContent, iteration]);

  // Trigger auto-save when loading finishes (after AI response)
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && chatMessages.length > 0) {
      // Delay to let final states settle
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveSession, 1000);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, chatMessages.length, saveSession]);

  // When final contentText arrives, update editor
  useEffect(() => {
    if (contentText && !contentEdited) {
      setEditorContent(contentText);
      lastContentRef.current = contentText;
    }
  }, [contentText, contentEdited]);

  // When final chatText arrives, add to chat messages
  useEffect(() => {
    if (chatText && !isLoading) {
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: chatText }];
        }
        return [...prev, { role: 'assistant', content: chatText, timestamp: Date.now() }];
      });
    }
  }, [chatText, isLoading]);

  const hasFile = !!result?.file_url;

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    if (value !== lastContentRef.current) {
      setContentEdited(true);
      updateLastResponse(value);
    } else {
      setContentEdited(false);
    }
  };

  const handleExecute = useCallback((message: string) => {
    setChatMessages(prev => [...prev, {
      role: 'user' as const,
      content: message.length > 500 ? message.slice(0, 200) + '...' : message,
      timestamp: Date.now(),
    }]);
    setChatMessages(prev => [...prev, {
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
    }]);

    execute('slides', message, user.id, selectedPreset, customTokens as Record<string, unknown> | null);
    setContentEdited(false);
    setEditMode(false);
  }, [execute, user.id, selectedPreset, customTokens]);

  const handleReset = () => {
    reset();
    setEditorContent('');
    setEditMode(false);
    setContentEdited(false);
    setChatMessages([]);
    lastContentRef.current = '';
    setSessionId(null);
    localStorage.removeItem('slides-active-session');
  };

  const handleLoadSession = (id: string) => {
    // Save current first if needed
    if (chatMessages.length > 0 && sessionId) {
      saveSession();
    }
    setSessionId(id);
    localStorage.setItem('slides-active-session', id);

    api.getSession(id)
      .then(({ session }) => {
        setChatMessages(session.chat_messages || []);
        setEditorContent(session.editor_content || '');
        setEditMode(false);
        setContentEdited(false);
        lastContentRef.current = session.editor_content || '';
        restoreState({
          conversationHistory: session.conversation_history || [],
          iteration: session.iteration,
          fileUrl: session.file_url,
          modelUsed: session.model_used,
          response: session.editor_content || '',
        });
      })
      .catch(() => {});
  };

  const handleDeleteSession = (id: string) => {
    api.deleteSession(id).then(() => {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) {
        handleReset();
      }
    }).catch(() => {});
  };

  const handleNewSession = () => {
    if (chatMessages.length > 0 && sessionId) {
      saveSession();
    }
    handleReset();
  };

  const handleLoadOutput = (output: SkillOutput) => {
    const fileUrl = output.file_url.startsWith('http')
      ? output.file_url
      : `${API_URL}${output.file_url}`;
    setChatMessages([]);
    setEditorContent('');
    setEditMode(false);
    setContentEdited(false);
    lastContentRef.current = '';
    setSessionId(null);
    localStorage.removeItem('slides-active-session');
    // Set result directly so the preview renders
    setResult({
      response: '',
      model_used: '',
      tokens_used: { input: 0, output: 0 },
      file_url: fileUrl,
    });
  };

  // Re-theme
  const [isRetheming, setIsRetheming] = useState(false);
  const handleRetheme = useCallback(async () => {
    if (!result?.file_url) return;
    setIsRetheming(true);
    try {
      const { file_url } = await api.rethemeSlides({
        file_url: result.file_url,
        preset: selectedPreset,
        custom_tokens: customTokens as Record<string, unknown> | null,
      });
      setResult({
        ...result,
        file_url,
      });
    } catch { /* ignore */ }
    finally { setIsRetheming(false); }
  }, [result, selectedPreset, customTokens, setResult]);

  // Show sessions list when no active work and data is loaded
  const showSessionsList = !initialLoading && !result && !isLoading && chatMessages.length === 0;

  return (
    <div className="flex h-full">
      {/* Center — Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E0E10]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-sm font-semibold text-white">Slides</h1>
            {result?.model_used && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {result.model_used}
              </span>
            )}
            {sessionId && (
              <Button
                variant="ghost" size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-white gap-1"
                onClick={handleNewSession}
              >
                <Plus className="w-3 h-3" />
                Nova sessao
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              const next = !chatOpen;
              setChatOpen(next);
              localStorage.setItem('slides-chat-open', String(next));
            }}
            title={chatOpen ? 'Fechar chat' : 'Abrir chat'}
          >
            {chatOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>
        </div>

        {/* Theme Editor */}
        {presets.length > 0 && (
          <ThemeEditor
            presets={presets}
            selectedPreset={selectedPreset}
            customTokens={customTokens}
            userId={user.id}
            onSelectPreset={setSelectedPreset}
            onCustomTokens={setCustomTokens}
            onPresetsChanged={setPresets}
          />
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {initialLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : showSessionsList ? (
            <div className="h-full overflow-auto px-6 py-8">
              {(sessions.length > 0 || outputs.length > 0) ? (
                <div className="max-w-2xl mx-auto space-y-8">
                  {/* Sessoes (continuaveis) */}
                  {sessions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessoes em andamento</p>
                      </div>
                      <div className="space-y-1.5">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="group flex items-center gap-3 px-4 py-3 bg-[#121214] border border-border rounded-lg hover:border-primary/30 cursor-pointer transition-colors"
                            onClick={() => handleLoadSession(session.id!)}
                          >
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{session.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {session.iteration && session.iteration > 0 && (
                                  <span>v{session.iteration}</span>
                                )}
                                {session.file_url && (
                                  <span className="text-primary">HTML gerado</span>
                                )}
                                <span>
                                  {session.updated_at
                                    ? new Date(session.updated_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id!);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outputs (arquivos HTML gerados) */}
                  {outputs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Apresentacoes geradas</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {outputs.map((output) => (
                          <button
                            key={output.id}
                            onClick={() => handleLoadOutput(output)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-[#121214] border border-border rounded-lg text-xs text-muted-foreground hover:text-white hover:border-primary/30 transition-colors text-left"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate">{output.title}</p>
                              <p className="text-[10px] opacity-60">
                                {new Date(output.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: '2-digit',
                                })}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <SkillContent
                    content=""
                    editMode={false}
                    contentEdited={false}
                    hasFile={false}
                    isLoading={false}
                    onContentChange={() => {}}
                    onToggleEditMode={() => {}}
                  />
                </div>
              )}
            </div>
          ) : (
            <SkillContent
              content={editorContent}
              editMode={editMode}
              contentEdited={contentEdited}
              hasFile={hasFile}
              isLoading={isLoading}
              onContentChange={handleEditorChange}
              onToggleEditMode={setEditMode}
              renderFile={
                result?.file_url ? (
                  <SlidesPreview
                    fileUrl={result.file_url}
                    response={result.response}
                    onRetheme={handleRetheme}
                    isRetheming={isRetheming}
                  />
                ) : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Right — Skill Chat */}
      <div
        className={cn(
          'border-l border-border transition-all duration-200 overflow-hidden',
          chatOpen ? 'w-80 lg:w-96' : 'w-0'
        )}
      >
        {chatOpen && (
          <SkillChat
            skillName="Slides"
            placeholder='Ex: "Apresentacao sobre o projeto X com 8 slides..."'
            isLoading={isLoading}
            currentStep={currentStep}
            error={error}
            iteration={iteration}
            messages={chatMessages}
            streamingText={streamingText}
            editorContent={editorContent}
            contentEdited={contentEdited}
            onExecute={handleExecute}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default function SlidesPage() {
  return (
    <UserProvider>
      <ConversationsProvider>
        <AppShell>
          <SlidesWorkspace />
        </AppShell>
      </ConversationsProvider>
    </UserProvider>
  );
}
