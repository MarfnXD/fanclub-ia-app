'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SkillExecutor } from '@/components/skills/skill-executor';
import { SlidesPreview } from '@/components/skills/slides-preview';
import { UserProvider } from '@/providers/user-provider';
import { ConversationsProvider } from '@/providers/conversations-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser } from '@/providers/user-provider';
import { api } from '@/lib/api';
import { API_URL } from '@/lib/constants';
import type { SkillOutput } from '@/lib/types';

function PreviousOutputs() {
  const user = useUser();
  const [outputs, setOutputs] = useState<SkillOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .outputs(user.id, 'slides')
      .then((res) => setOutputs(res.outputs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return null;
  if (outputs.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-display text-lg font-semibold text-white mb-4">
        Apresentações anteriores
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {outputs.map((output) => {
          const slideCount = (output.metadata as Record<string, unknown>)?.slide_count;
          const date = new Date(output.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          // Use Supabase public URL or fallback to local
          const previewUrl = output.file_url.startsWith('http')
            ? output.file_url
            : `${API_URL}${output.file_url}`;

          return (
            <Card
              key={output.id}
              className="bg-[#121214] border-border p-4 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {output.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {date}
                    {slideCount ? ` · ${slideCount} slides` : ''}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SlidesPageContent() {
  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/skills">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Skills
            </Button>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-white mb-2">
            Criar Slides
          </h1>
          <p className="text-muted-foreground text-sm">
            Descreva sua apresentação e a IA gera slides HTML profissionais com o design
            system da Fan Club.
          </p>
        </div>

        <SkillExecutor
          skillId="slides"
          skillName="Slides"
          placeholder="Ex: Apresentação de 8 slides sobre o projeto X para o cliente Y, incluindo cronograma e orçamento..."
          renderResult={(result) =>
            result.file_url ? (
              <SlidesPreview fileUrl={result.file_url} response={result.response} />
            ) : (
              <div className="markdown-content text-sm p-4 bg-[#121214] rounded-lg border border-border">
                <p>{result.response}</p>
              </div>
            )
          }
        />

        <PreviousOutputs />
      </div>
    </AppShell>
  );
}

export default function SlidesPage() {
  return (
    <UserProvider>
      <ConversationsProvider>
        <SlidesPageContent />
      </ConversationsProvider>
    </UserProvider>
  );
}
