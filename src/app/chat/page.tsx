'use client';

import { useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ChatContainer } from '@/components/chat/chat-container';
import { UserProvider, useUser } from '@/providers/user-provider';
import { useConversations } from '@/hooks/use-conversations';
import { useChat } from '@/hooks/use-chat';

function ChatPageContent() {
  const user = useUser();
  const {
    activeConversation,
    createConversation,
    addMessage,
    updateLastMessage,
  } = useConversations();

  const { sendMessage, isLoading } = useChat({
    userId: user.id,
    level: user.level,
    onAddMessage: addMessage,
    onUpdateLastMessage: updateLastMessage,
  });

  const handleSend = useCallback(
    (content: string) => {
      let convId = activeConversation?.id;
      if (!convId) {
        const newConv = createConversation();
        convId = newConv.id;
      }
      sendMessage(convId, content, activeConversation?.messages || []);
    },
    [activeConversation, sendMessage, createConversation]
  );

  return (
    <AppShell>
      <ChatContainer
        messages={activeConversation?.messages || []}
        isLoading={isLoading}
        onSend={handleSend}
      />
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <UserProvider>
      <ChatPageContent />
    </UserProvider>
  );
}
