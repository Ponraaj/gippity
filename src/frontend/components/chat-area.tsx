import { useEffect, useRef } from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { WelcomeScreen } from "../components/welcome-screen";
import { MessageList } from "../components/message-list";
import { ChatInput } from "../components/chat-input";
import { useChat, type Message, type CreateMessage } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface ChatAreaProps {
  sidebarOpen: boolean;
  threadId: string;
  initialMessages?: Message[];
}

interface APIKeyStore {
  getKey: (provider: string) => string | undefined;
}

interface ModelStore {
  selectedModel: string;
  getModelConfig: () => {
    headerKey: string;
    provider: string;
  };
}

const useAPIKeyStore = (): APIKeyStore => ({
  getKey: () => process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const useModelStore = () => ({
  selectedModel: "gpt-3.5-turbo",
  getModelConfig: () => ({
    headerKey: "Authorization",
    provider: "openai",
  }),
});

const createMessage = async (threadId: string, message: Message) => {
  console.log("Saving message:", { threadId, message });
};

export function ChatArea({ sidebarOpen, threadId, initialMessages = [] }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { getKey } = useAPIKeyStore();
  const selectedModel = useModelStore().selectedModel;
  const modelConfig = useModelStore().getModelConfig();

  const {
    messages,
    input,
    status,
    setInput,
    setMessages,
    append: originalAppend,
    stop,
    reload,
    error,
  } = useChat({
    id: threadId,
    initialMessages,
    experimental_throttle: 50,
    onFinish: async ({ parts }) => {
      if (!parts) return;
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: parts.join(''),
        createdAt: new Date(),
      };

      try {
        await createMessage(threadId, aiMessage);
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    },
    headers: {
      [modelConfig.headerKey]: getKey(modelConfig.provider) || '',
    },
    body: {
      model: selectedModel,
    },
  });

  const append = async (message: Message | CreateMessage) => {
    await originalAppend(message);
  };

  const mappedStatus = status === "ready" ? "idle" : 
                      status === "submitted" || status === "streaming" ? "loading" : 
                      "error";

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
              <MessageList 
                messages={messages}
                status={mappedStatus}
                setMessages={setMessages}
                reload={reload}
                error={error || null}
                stop={stop}
              />
            ) : (
              <WelcomeScreen append={append} />
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="bg-card border-t-0 supports-backdrop-filter:bg-background/60 backdrop-blur-sm">
        <ChatInput
          threadId={threadId}
          input={input}
          status={mappedStatus}
          append={append}
          setInput={setInput}
          stop={stop}
        />
      </div>
    </div>
  );
}
