'use client';

import { AppShell } from '@/components/layout/app-shell';
import { SkillCard } from '@/components/skills/skill-card';
import { UserProvider, useUser } from '@/providers/user-provider';
import { ConversationsProvider } from '@/providers/conversations-provider';
import { SKILLS } from '@/lib/constants';
import { Sparkles } from 'lucide-react';

function SkillsPageContent() {
  const user = useUser();

  // massa users only see chat
  if (user.level === 'massa') {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Skills disponíveis apenas para usuários Power e Admin.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-semibold text-white mb-2">Skills</h1>
          <p className="text-muted-foreground text-sm">
            Ferramentas de criação e produção potencializadas por IA.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKILLS.map((skill, i) => (
            <SkillCard key={skill.id} skill={skill} index={i} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function SkillsPage() {
  return (
    <UserProvider>
      <ConversationsProvider>
        <SkillsPageContent />
      </ConversationsProvider>
    </UserProvider>
  );
}
