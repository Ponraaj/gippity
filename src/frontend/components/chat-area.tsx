import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useChat as useAIChat } from "@ai-sdk/react";
import { ScrollArea } from "../components/ui/scroll-area";
import { WelcomeScreen } from "../components/welcome-screen";
import { MessageList } from "../components/message-list";
import { ChatInput } from "../components/chat-input";
import { cn } from "../../lib/utils";
import { useTheme } from "next-themes";
import { cacheService } from "@/dexie/cache-service";
import type { Id } from "../../../convex/_generated/dataModel";
import { CachedMessage } from "@/dexie/db";

interface ChatAreaProps {
  sidebarOpen: boolean;
  userId: Id<"users">;
}

interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  threadId: Id<"threads">;
  userId: Id<"users">;
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  tokenCount?: number;
  model?: string;
  createdAt: number;
  updatedAt: number;
}

export function ChatArea({ sidebarOpen, userId }: ChatAreaProps) {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const [error, setError] = useState<string | null>(null);
  const [cachedMessages, setCachedMessages] = useState<CachedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const watcherRef = useRef<(() => void) | null>(null);
  const lastThreadIdRef = useRef<string | undefined>(undefined);
  const [currentThreadId, setCurrentThreadId] = useState<
    Id<"threads"> | undefined
  >(threadId as Id<"threads"> | undefined);

  // Load messages from cache when thread changes
  const loadMessages = useCallback(
    async (forceRefresh = false) => {
      if (!currentThreadId) {
        setCachedMessages([]);
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const messages = await cacheService.getMessages(
          currentThreadId,
          userId,
          forceRefresh,
        );
        setCachedMessages(messages);
        setError(null);
      } catch (error) {
        console.error("Error loading messages:", error);
        setError("Failed to load messages. Please try again.");
      } finally {
        setIsLoadingMessages(false);
        setIsInitialized(true);
      }
    },
    [currentThreadId, userId],
  );

  // Update currentThreadId when URL changes
  useEffect(() => {
    const newThreadId = threadId as Id<"threads"> | undefined;
    if (currentThreadId !== newThreadId) {
      setCurrentThreadId(newThreadId);
    }
  }, [threadId, currentThreadId]);

  // Load messages when thread changes
  useEffect(() => {
    if (lastThreadIdRef.current !== threadId) {
      lastThreadIdRef.current = threadId;
      setIsInitialized(false);
      loadMessages(true); // Force refresh from server when thread changes
    }
  }, [threadId, loadMessages]);

  // Watch for real-time updates to cached messages
  useEffect(() => {
    if (currentThreadId) {
      // Clean up previous watcher
      if (watcherRef.current) {
        watcherRef.current();
      }

      // Set up new watcher
      watcherRef.current = cacheService.watchMessages(
        currentThreadId,
        (messages) => {
          setCachedMessages(messages);
        },
      );

      return () => {
        if (watcherRef.current) {
          watcherRef.current();
          watcherRef.current = null;
        }
      };
    } else {
      // Clean up watcher when no thread is selected
      if (watcherRef.current) {
        watcherRef.current();
        watcherRef.current = null;
      }
      setCachedMessages([]);
    }
  }, [currentThreadId]);

  // Convert cached messages to AI SDK format
  const initialMessages = cachedMessages
    .filter((msg) => !msg.isStreaming) // Don't include streaming messages in initial
    .map((msg) => ({
      id: msg._id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

  // Use AI SDK's useChat hook with thread-specific key
  const {
    messages: aiMessages,
    input,
    setInput,
    handleSubmit: handleAISubmit,
    status,
    stop,
    reload,
    setMessages,
  } = useAIChat({
    api: "/api/chat",
    key: `thread-${currentThreadId || "new"}`,
    id: currentThreadId,
    initialMessages: isInitialized ? initialMessages : [],
    body: {
      userId,
      threadId: currentThreadId,
      model: "gemini-2.0-flash",
    },
    onResponse: async (response) => {
      try {
        const newThreadId = response.headers.get("X-Thread-ID");
        const messageId = response.headers.get("X-Message-ID");

        // Handle new thread creation
        if (newThreadId && !currentThreadId) {
          const newThread = {
            _id: newThreadId as Id<"threads">,
            _creationTime: Date.now(),
            userId,
            title: input.length > 50 ? input.substring(0, 50) + "..." : input,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cachedAt: Date.now(),
            version: 1,
          };
          await cacheService.cacheThread(newThread);

          // Update the current thread ID state
          setCurrentThreadId(newThreadId as Id<"threads">);

          // Navigate to new thread
          navigate(`/chat/${newThreadId}`);

          // Cache the user message now that we have a thread ID
          const userMessage: CachedMessage = {
            _id: `user-${Date.now()}` as Id<"messages">,
            _creationTime: Date.now(),
            threadId: newThreadId as Id<"threads">,
            userId,
            role: "user",
            content: input.trim(),
            isStreaming: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cachedAt: Date.now(),
            version: 1,
          };
          await cacheService.cacheMessage(userMessage);
        }

        // Only create assistant message if we have a messageId and content is not empty
        if (messageId && (newThreadId || currentThreadId)) {
          // The actual message creation will be handled by syncStreamingMessages
          // when the first content chunk arrives
        }
      } catch (error) {
        console.error("Error in onResponse:", error);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setError("Failed to send message. Please try again.");
    },
    onFinish: async (message) => {
      try {
        // Finalize the message when AI finishes responding
        if (message.role === "assistant") {
          await cacheService.finalizeMessage(
            message.id as Id<"messages">,
            message.content.split(" ").length,
          );
        }
      } catch (error) {
        console.error("Error finalizing message:", error);
      }
    },
  });

  // Check if AI is currently processing
  const isAILoading = status === "streaming";

  // Sync AI messages with cache during streaming
  useEffect(() => {
    let isMounted = true;
    let updateTimeout: NodeJS.Timeout | null = null;

    const syncStreamingMessages = async () => {
      if (!isMounted) return;

      try {
        // Get the latest assistant message
        const latestAssistantMessage = aiMessages
          .filter((msg) => msg.role === "assistant")
          .pop();

        if (latestAssistantMessage && latestAssistantMessage.content.trim()) {
          // Clear any existing timeout
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }

          // Set a new timeout to batch updates
          updateTimeout = setTimeout(async () => {
            if (!isMounted) return;

            try {
              // First check if the message exists in Dexie
              const existingMessage = await cacheService
                .getMessages(currentThreadId!, userId, false)
                .then((messages) =>
                  messages.find((m) => m._id === latestAssistantMessage.id),
                );

              if (!existingMessage) {
                // Only create new message if we have content
                const newMessage: CachedMessage = {
                  _id: latestAssistantMessage.id as Id<"messages">,
                  _creationTime: Date.now(),
                  threadId: currentThreadId!,
                  userId,
                  role: "assistant",
                  content: latestAssistantMessage.content,
                  isStreaming: true,
                  model: "gemini-2.0-flash",
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  cachedAt: Date.now(),
                  version: 1,
                };
                await cacheService.cacheMessage(newMessage);
              } else {
                // If message exists, update its content
                await cacheService.updateMessageContent(
                  latestAssistantMessage.id as Id<"messages">,
                  latestAssistantMessage.content,
                  true, // isStreaming
                );
              }
            } catch (error) {
              console.error("Error syncing streaming message:", error);
            }
          }, 100); // Batch updates every 100ms
        }
      } catch (error) {
        console.error("Error in syncStreamingMessages:", error);
      }
    };

    if (aiMessages.length > 0 && isAILoading) {
      syncStreamingMessages();
    }

    return () => {
      isMounted = false;
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [aiMessages, isAILoading, currentThreadId, userId]);

  // Create display messages with better logic
  const displayMessages: Message[] = useMemo(() => {
    // If we're actively streaming, use AI messages as source of truth
    if (isAILoading && aiMessages.length > 0) {
      return aiMessages.map((msg) => ({
        _id: msg.id as Id<"messages">,
        _creationTime: Date.now(),
        threadId: currentThreadId || ("" as Id<"threads">),
        userId,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        isStreaming: msg.role === "assistant" && isAILoading,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    }

    // Otherwise use cached messages
    return cachedMessages
      .map((msg) => ({
        _id: msg._id,
        _creationTime: msg._creationTime,
        threadId: msg.threadId,
        userId: msg.userId,
        role: msg.role,
        content: msg.content,
        isStreaming: msg.isStreaming || false,
        tokenCount: msg.tokenCount,
        model: msg.model,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [cachedMessages, aiMessages, isAILoading, currentThreadId, userId]);

  // Sync initial messages from cache when they change (only when not actively chatting)
  useEffect(() => {
    if (!isAILoading && isInitialized && cachedMessages.length > 0) {
      const formattedMessages = cachedMessages
        .filter((msg) => !msg.isStreaming) // Filter out streaming messages
        .map((msg) => ({
          id: msg._id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }));

      // Only update if messages are different to avoid infinite loops
      const currentMessageIds = aiMessages.map((m) => m.id).sort();
      const cachedMessageIds = formattedMessages.map((m) => m.id).sort();

      if (
        JSON.stringify(currentMessageIds) !==
          JSON.stringify(cachedMessageIds) ||
        formattedMessages.some(
          (msg, i) => msg.content !== aiMessages[i]?.content,
        )
      ) {
        setMessages(formattedMessages);
      }
    } else if (!currentThreadId && aiMessages.length > 0) {
      setMessages([]);
    }
  }, [
    cachedMessages,
    currentThreadId,
    isAILoading,
    isInitialized,
    setMessages,
    aiMessages,
  ]);

  // Reset error when thread changes
  useEffect(() => {
    setError(null);
  }, [threadId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      });
    }
  }, [aiMessages, cachedMessages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isAILoading) return;

    setError(null);

    // Store the current input for caching
    const currentInput = input.trim();

    // Cache user message optimistically if we have a current thread
    if (currentThreadId) {
      try {
        const userMessageId = `user-${Date.now()}` as Id<"messages">;
        const userMessage: CachedMessage = {
          _id: userMessageId,
          _creationTime: Date.now(),
          threadId: currentThreadId,
          userId,
          role: "user",
          content: currentInput,
          isStreaming: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cachedAt: Date.now(),
          version: 1,
        };

        await cacheService.cacheMessage(userMessage);
      } catch (error) {
        console.error("Error caching user message:", error);
      }
    }

    try {
      handleAISubmit(e);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const hasMessages = displayMessages.length > 0;
  const errorObject = error ? new Error(error) : null;

  // Show loading state while messages are being fetched initially
  if (isLoadingMessages && !isInitialized) {
    return (
      <div
        className={cn(
          "flex h-full flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0",
        )}
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-0" : "lg:ml-0",
      )}
    >
      <div
        className="flex-1 overflow-auto"
        ref={scrollRef}
        style={{ backgroundColor: theme === "light" ? "#f9f3f8" : undefined }}
      >
        <ScrollArea className="custom-scrollbar h-full">
          <div className="flex min-h-full flex-col">
            {hasMessages ? (
              <MessageList
                messages={displayMessages.map((m) => ({
                  id: m._id,
                  role: m.role,
                  content: m.content,
                  isStreaming: m.isStreaming || false,
                }))}
                status={isAILoading ? "loading" : "idle"}
                setMessages={() => {}} // Not needed with AI SDK
                reload={() => {
                  loadMessages(true); // Force refresh from server
                  reload();
                }}
                error={errorObject}
                stop={stop}
              />
            ) : (
              <WelcomeScreen />
            )}
          </div>
        </ScrollArea>
      </div>

      <div
        className="supports-backdrop-filter:bg-background/60 border-t-0 backdrop-blur-sm"
        style={{ backgroundColor: theme === "light" ? "#fbeff8" : undefined }}
      >
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          stop={stop}
          isLoading={isAILoading}
        />
      </div>
    </div>
  );
}
