import { createContext, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

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

interface Thread {
  _id: Id<"threads">;
  _creationTime: number;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  updatedAt: number;
}

interface ChatContextType {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean; // Keep for backward compatibility, derived from status
  status: "submitted" | "streaming" | "ready" | "error"; // Modern status field
  stop: () => void;
  currentThread: Thread | null;
  isLoadingMessages: boolean;
  error: string | null;
  // Sidebar functionality
  threads: Thread[];
  createNewChat: () => void;
  selectChat: (threadId: Id<"threads">) => void;
  deleteChat: (threadId: Id<"threads">) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentThreadId: Id<"threads"> | null;
  setCurrentThreadId: (id: Id<"threads"> | null) => void;
  // AI SDK integration - Fixed type
  append: (message: {
    role: "user";
    content: string;
  }) => Promise<string | null | undefined>;
  reload: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: Id<"users">;
}) {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(
    threadId ? (threadId as Id<"threads">) : null,
  );

  // Get all user threads for the sidebar
  const threads = useQuery(api.queries.getUserThreads) || [];

  // Get current thread info
  const currentThread = threads.find((t) => t._id === currentThreadId) || null;

  // Get messages for the current thread
  const dbMessages =
    useQuery(
      api.queries.getThreadMessages,
      currentThreadId ? { threadId: currentThreadId } : "skip",
    ) || [];

  // Check if we're still loading messages
  const isLoadingMessages = currentThreadId ? dbMessages === undefined : false;

  // Convert database messages to AI SDK format
  const aiMessages = dbMessages.map((msg) => ({
    id: msg._id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));

  // Use AI SDK's useChat hook
  const {
    messages: streamMessages,
    input,
    setInput,
    handleSubmit: handleAISubmit,
    status, // Modern replacement for deprecated isLoading
    stop,
    append,
    reload,
  } = useAIChat({
    api: "/api/chat",
    initialMessages: aiMessages,
    body: {
      userId,
      threadId: currentThreadId,
      model: "gemini-2.0-flash",
    },
    onResponse: async (response) => {
      // Handle the custom headers from your API
      const newThreadId = response.headers.get("X-Thread-ID");
      // Removed unused messageId variable
      if (newThreadId && !currentThreadId) {
        setCurrentThreadId(newThreadId as Id<"threads">);
        navigate(`/chat/${newThreadId}`);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setError("Failed to send message. Please try again.");
    },
  });

  // Convert status to boolean for backward compatibility
  const isStreamLoading = status === "submitted" || status === "streaming";

  // Mutations
  const deleteThreadMutation = useMutation(api.threads.deleteThread);

  // Reset error when thread changes
  useEffect(() => {
    setError(null);
  }, [threadId]);

  // Update currentThreadId when URL changes
  useEffect(() => {
    const newThreadId = threadId ? (threadId as Id<"threads">) : null;
    setCurrentThreadId(newThreadId);
  }, [threadId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isStreamLoading) return;

    setError(null);
    try {
      // Removed unnecessary await since handleAISubmit handles the async operation
      handleAISubmit(e);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  // Use streaming messages if available, otherwise fall back to database messages
  const messages =
    streamMessages.length > 0
      ? streamMessages.map((msg) => ({
          _id: msg.id as Id<"messages">,
          _creationTime: Date.now(),
          threadId: currentThreadId!,
          userId,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          isStreaming: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }))
      : dbMessages;

  // Sidebar functions
  const createNewChat = () => {
    navigate("/");
    setCurrentThreadId(null);
  };

  const selectChat = (threadId: Id<"threads">) => {
    navigate(`/chat/${threadId}`);
  };

  const deleteChat = async (threadId: Id<"threads">) => {
    try {
      await deleteThreadMutation({ threadId });
      // If we're currently viewing the deleted thread, navigate to home
      if (threadId === currentThreadId) {
        navigate("/");
        setCurrentThreadId(null);
      }
    } catch (error) {
      console.error("Error deleting thread:", error);
      setError("Failed to delete chat. Please try again.");
    }
  };

  const contextValue: ChatContextType = {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading: isStreamLoading, // Backward compatibility
    status, // Modern status field
    stop,
    currentThread,
    isLoadingMessages,
    error,
    // Sidebar functionality
    threads,
    createNewChat,
    selectChat,
    deleteChat,
    searchQuery,
    setSearchQuery,
    currentThreadId,
    setCurrentThreadId,
    // AI SDK integration
    append,
    reload,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
