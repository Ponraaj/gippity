"use client";

import { useState, useEffect } from 'react';
import { Message } from '../contexts/chat-context';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { MarkdownRenderer } from '../components/markdown-renderer';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const [mounted, setMounted] = useState(false);
  const isUser = message.role === 'user';
  console.log(isLast)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar className="h-8 w-8 mt-1 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div className={`${
          isUser 
            ? 'ml-auto max-w-lg bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3' 
            : 'bg-transparent'
        }`}>
          {isUser ? (
            <p className="text-sm">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        
        <div className={`text-xs text-muted-foreground mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {mounted ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
