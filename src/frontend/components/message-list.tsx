import { Message } from "ai";
import { MessageBubble } from "../components/message-bubble";

interface MessageListProps {
  messages: Message[];
  status: "idle" | "loading" | "error";
  setMessages: (messages: Message[]) => void;
  reload: () => void;
  error: Error | null;
  stop: () => void;
}

export function MessageList({ 
  messages, 
  status, 
  setMessages, 
  reload, 
  error, 
  stop 
}: MessageListProps) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
      {status === "loading" && (
        <div className="flex justify-center">
          <div className="animate-pulse text-muted-foreground">AI is thinking...</div>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center gap-2 text-destructive">
          <p>Error: {error.message}</p>
          <button 
            onClick={reload}
            className="text-sm underline hover:text-destructive/80"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
