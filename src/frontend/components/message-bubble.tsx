import { useState, useEffect } from "react";
import { Message } from "ai";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { MarkdownRenderer } from "../components/markdown-renderer";
import { User, Bot } from "lucide-react";
import { useTheme } from "next-themes";

interface MessageBubbleProps {
  message: Message;
  // isLast: boolean;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [mounted, setMounted] = useState(false);
  const isUser = message.role === "user";
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <Avatar className="mt-1 h-8 w-8">
          <AvatarFallback 
            className="bg-primary text-primary-foreground"
            style={{
              backgroundColor: theme === "light" ? "#a84470" : undefined,
              color: theme === "light" ? "white" : undefined,
            }}
          >
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-3xl flex-1 ${isUser ? "order-first" : ""}`}>
        <div
          className={`${
            isUser
              ? "ml-auto max-w-lg rounded-2xl rounded-tr-sm px-4 py-3"
              : "bg-transparent"
          }`}
          style={{
            backgroundColor: isUser && theme === "light" ? "#fbeff8" : undefined,
          }}
        >
          {isUser ? (
            <p 
              className="text-sm"
              style={{ color: theme === "light" ? "#77347b" : undefined }}
            >{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        <div
          className={`mt-2 text-xs ${isUser ? "text-right" : "text-left"}`}
          style={{ color: theme === "light" ? "#c66198" : undefined }}
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
          <AvatarFallback 
            className="bg-secondary"
            style={{
              backgroundColor: theme === "light" ? "#a84470" : undefined,
              color: theme === "light" ? "white" : undefined,
            }}
          >
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
