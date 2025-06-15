import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { ScrollArea } from "../components/ui/scroll-area";
import { WelcomeScreen } from "../components/welcome-screen";
import { MessageList } from "../components/message-list";
import { ChatInput } from "../components/chat-input";
import { useChat } from "../context/chat-context";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface ChatAreaProps {
  sidebarOpen: boolean;
  userId: Id<"users">; // Keep for potential future use
}

export function ChatArea({ sidebarOpen }: ChatAreaProps) {
  const { threadId } = useParams<{ threadId: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    setCurrentThreadId,
    error,
  } = useChat();

  // Sync thread ID
  useEffect(() => {
    setCurrentThreadId(threadId ? (threadId as Id<"threads">) : null);
  }, [threadId, setCurrentThreadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

  // Convert string error to Error object if needed
  const errorObject = error ? new Error(error) : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-0" : "lg:ml-0",
      )}
    >
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <ScrollArea className="custom-scrollbar h-full">
          <div className="flex min-h-full flex-col">
            {hasMessages ? (
              <MessageList
                messages={messages.map((m) => ({
                  id: m._id,
                  role: m.role,
                  content: m.content,
                  isStreaming: m.isStreaming || false,
                }))}
                status={isLoading ? "loading" : "idle"}
                setMessages={() => {}} // Not needed with AI SDK
                reload={() => {}} // Can be implemented later if needed
                error={errorObject} // Convert string to Error object
                stop={stop}
              />
            ) : (
              <WelcomeScreen />
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="bg-card supports-backdrop-filter:bg-background/60 border-t-0 backdrop-blur-sm">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          stop={stop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
