"use client";

import { Message } from '../contexts/chat-context';
import { MessageBubble } from '../components/message-bubble';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 p-4 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  );
}
