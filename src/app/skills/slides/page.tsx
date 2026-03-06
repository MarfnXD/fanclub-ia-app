'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SkillExecutor } from '@/components/skills/skill-executor';
import { SlidesPreview } from '@/components/skills/slides-preview';
import { UserProvider } from '@/providers/user-provider';
import { Button } from '@/components/ui/button';

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
      </div>
    </AppShell>
  );
}

export default function SlidesPage() {
  return (
    <UserProvider>
      <SlidesPageContent />
    </UserProvider>
  );
}
