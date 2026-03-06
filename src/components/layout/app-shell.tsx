'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';
import { useConversationsContext } from '@/providers/conversations-provider';
import { useUser } from '@/providers/user-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useUser();
  const {
    conversations,
    activeId,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useConversationsContext();

  const sidebarProps = {
    conversations,
    activeId,
    userLevel: user.level,
    onNewChat: createConversation,
    onSelectConversation: selectConversation,
    onDeleteConversation: deleteConversation,
  };

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar {...sidebarProps} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-display text-sm font-semibold text-white">Fan Club IA</span>
        </div>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
