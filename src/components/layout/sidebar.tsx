'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sparkles, Plus, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/types';
import { LEVEL_LABELS } from '@/lib/constants';
import type { UserLevel } from '@/lib/types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  userLevel: UserLevel;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/skills', label: 'Skills', icon: Sparkles },
];

export function Sidebar({
  conversations,
  activeId,
  userLevel,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#0A0A0B] border-r border-border w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-sm font-semibold text-white">Fan Club IA</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Conversations */}
      {pathname.startsWith('/chat') && (
        <>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Conversas
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNewChat}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-0.5 pb-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors',
                    activeId === conv.id
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <span className="flex-1 truncate">{conv.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            userLevel === 'admin' && 'border-cyan text-cyan',
            userLevel === 'power' && 'border-primary text-primary',
            userLevel === 'massa' && 'border-muted-foreground text-muted-foreground'
          )}
        >
          {LEVEL_LABELS[userLevel]}
        </Badge>
      </div>
    </div>
  );
}
