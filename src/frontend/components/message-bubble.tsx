import { useState, useEffect } from "react";
import { Message } from "ai";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { MarkdownRenderer } from "../components/markdown-renderer";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

export function MessageBubble({ message, isLast }: MessageBubbleProps) {
  const [mounted, setMounted] = useState(false);
  const isUser = message.role === "user";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="bg-primary mt-1 h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-3xl flex-1 ${isUser ? "order-first" : ""}`}>
        <div
          className={`${
            isUser
              ? "chat-dialog-box ml-auto max-w-lg rounded-2xl rounded-tr-sm px-4 py-3"
              : "bg-transparent"
          }`}
        >
          {isUser ? (
            <p className="chat-message-text text-sm">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div
          className={`text-muted-foreground mt-2 text-xs ${isUser ? "text-right" : "text-left"}`}
        >
          {mounted && message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </div>
      </div>

      {isUser && (
        <Avatar className="mt-1 h-8 w-8">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
