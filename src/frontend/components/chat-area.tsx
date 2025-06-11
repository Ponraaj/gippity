import { useEffect, useRef } from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { WelcomeScreen } from "../components/welcome-screen";
import { MessageList } from "../components/message-list";
import { ChatInput } from "../components/chat-input";
import { useChat } from "../contexts/chat-context";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  sidebarOpen: boolean;
}

export function ChatArea({ sidebarOpen }: ChatAreaProps) {
  const { messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hasMessages = messages.length > 0;

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
              <MessageList messages={messages} />
            ) : (
              <WelcomeScreen />
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 border-t backdrop-blur-sm">
        <ChatInput />
      </div>
    </div>
  );
}
