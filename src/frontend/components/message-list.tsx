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
  reload,
  error,
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
          <div className="text-muted-foreground animate-pulse">
            AI is thinking...
          </div>
        </div>
      )}
      {error && (
        <div className="text-destructive flex flex-col items-center gap-2">
          <p>Error: {error.message}</p>
          <button
            onClick={reload}
            className="hover:text-destructive/80 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
