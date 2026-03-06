'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare, Sparkles, Plus, Trash2, ChevronLeft, ChevronRight,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/types';
import { LEVEL_LABELS } from '@/lib/constants';
import type { UserLevel } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  userLevel: UserLevel;
  collapsed: boolean;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleLevel?: () => void;
  onToggleCollapse: () => void;
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
  collapsed,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onToggleLevel,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-[#0A0A0B] border-r border-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-border',
        collapsed ? 'justify-center p-3' : 'justify-between p-4'
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('p-2 space-y-1', collapsed && 'px-1.5')}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm transition-colors',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          return linkContent;
        })}
      </nav>

      {/* Conversations — only when expanded and on chat page */}
      {!collapsed && pathname.startsWith('/chat') && (
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

      {/* Spacer when collapsed or not on chat */}
      {(collapsed || !pathname.startsWith('/chat')) && <div className="flex-1" />}

      {/* Footer */}
      <div className={cn('border-t border-border', collapsed ? 'p-2' : 'p-4', 'space-y-2')}>
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center gap-2 text-muted-foreground hover:text-white transition-colors w-full rounded-lg p-1.5',
            collapsed ? 'justify-center' : '',
            'hover:bg-secondary/50'
          )}
          title={collapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-xs">Minimizar</span>
            </>
          )}
        </button>

        {/* Level toggle */}
        {!collapsed ? (
          <button
            onClick={onToggleLevel}
            className="flex items-center gap-2 w-full group"
            title="Alternar nivel de acesso"
          >
            <Badge
              variant="outline"
              className={cn(
                'text-xs cursor-pointer transition-colors',
                userLevel === 'admin' && 'border-cyan text-cyan',
                userLevel === 'power' && 'border-primary text-primary',
                userLevel === 'massa' && 'border-muted-foreground text-muted-foreground'
              )}
            >
              {LEVEL_LABELS[userLevel]}
            </Badge>
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              trocar
            </span>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleLevel}
                className="flex justify-center w-full"
                title="Alternar nivel"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] cursor-pointer transition-colors',
                    userLevel === 'admin' && 'border-cyan text-cyan',
                    userLevel === 'power' && 'border-primary text-primary',
                    userLevel === 'massa' && 'border-muted-foreground text-muted-foreground'
                  )}
                >
                  {LEVEL_LABELS[userLevel][0]}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {LEVEL_LABELS[userLevel]}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
