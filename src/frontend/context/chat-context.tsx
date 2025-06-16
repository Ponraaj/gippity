import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cacheService } from "@/dexie/cache-service";
import type { Id } from "../../../convex/_generated/dataModel";
import { CachedThread } from "@/dexie/db";

interface ChatContextType {
  // Sidebar functionality
  threads: CachedThread[];
  isLoadingThreads: boolean;
  createNewChat: () => void;
  selectChat: (threadId: Id<"threads">) => void;
  deleteChat: (threadId: Id<"threads">) => void;
  refreshThreads: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  error: string | null;
  // New sync-related functionality
  isOnline: boolean;
  lastSyncTime: number | null;
  forceSyncThreads: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: Id<"users">;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [threads, setThreads] = useState<CachedThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Refs to manage cleanup
  const watcherCleanupRef = useRef<(() => void) | null>(null);
  const periodicSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mutations
  const deleteThreadMutation = useMutation(api.threads.deleteThread);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      if (userId) {
        loadThreads(false);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId]);

  // Set up real-time watching and initial load
  useEffect(() => {
    if (!userId) return;

    // Initial load
    loadThreads();

    // Set up real-time watcher
    watcherCleanupRef.current = cacheService.watchThreads(
      userId,
      (updatedThreads) => {
        setThreads(updatedThreads);
        setLastSyncTime(Date.now());
      },
    );

    // Set up periodic sync (every 5 minutes, but only if online)
    periodicSyncIntervalRef.current = setInterval(
      () => {
        if (isOnline) {
          loadThreads(false); // Silent refresh
        }
      },
      5 * 60 * 1000,
    );

    return () => {
      // Cleanup watcher
      if (watcherCleanupRef.current) {
        watcherCleanupRef.current();
        watcherCleanupRef.current = null;
      }

      // Cleanup periodic sync
      if (periodicSyncIntervalRef.current) {
        clearInterval(periodicSyncIntervalRef.current);
        periodicSyncIntervalRef.current = null;
      }
    };
  }, [userId, isOnline]);

  const loadThreads = async (showLoading = true, forceRefresh = false) => {
    if (!userId) return;

    try {
      if (showLoading) setIsLoadingThreads(true);

      // Use the new sync service with smart caching
      const cachedThreads = await cacheService.getThreads(userId, forceRefresh);

      setThreads(cachedThreads);
      setLastSyncTime(Date.now());
      setError(null);
    } catch (error) {
      console.error("Error loading threads:", error);
      setError("Failed to load chats. Please try again.");

      // If we're offline, try to show cached data
      if (!isOnline) {
        try {
          const cachedThreads = await cacheService.getThreads(userId, false);
          setThreads(cachedThreads);
          setError("You're offline. Showing cached chats.");
        } catch (cacheError) {
          console.error("Error loading cached threads:", cacheError);
        }
      }
    } finally {
      if (showLoading) setIsLoadingThreads(false);
    }
  };

  const refreshThreads = () => {
    loadThreads(true, false); // Show loading, but use smart caching
  };

  const forceSyncThreads = async () => {
    if (!isOnline) {
      setError("Cannot sync while offline");
      return;
    }

    try {
      setIsLoadingThreads(true);
      await loadThreads(false, true); // Force refresh from server
      setError(null);
    } catch (error) {
      console.error("Error forcing sync:", error);
      setError("Failed to sync chats. Please try again.");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const createNewChat = () => {
    navigate("/");
  };

  const selectChat = (threadId: Id<"threads">) => {
    navigate(`/chat/${threadId}`);
  };

  const deleteChat = async (threadId: Id<"threads">) => {
    try {
      // Optimistically remove from UI
      setThreads((prev) => prev.filter((t) => t._id !== threadId));

      // Remove from cache first (this handles both cache and IndexedDB)
      await cacheService.deleteThread(threadId);

      // If online, also delete from Convex
      if (isOnline) {
        try {
          await deleteThreadMutation({ threadId });
        } catch (convexError) {
          console.warn(
            "Failed to delete from server, will retry on sync:",
            convexError,
          );
          // Don't throw here - the cache deletion succeeded
          // The server deletion will be handled on next sync
        }
      }

      setError(null);
    } catch (error) {
      console.error("Error deleting thread:", error);
      setError("Failed to delete chat. Please try again.");

      // Reload threads on error to restore state
      loadThreads(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watcherCleanupRef.current) {
        watcherCleanupRef.current();
      }
      if (periodicSyncIntervalRef.current) {
        clearInterval(periodicSyncIntervalRef.current);
      }
    };
  }, []);

  const contextValue: ChatContextType = {
    threads,
    isLoadingThreads,
    createNewChat,
    selectChat,
    deleteChat,
    refreshThreads,
    searchQuery,
    setSearchQuery,
    error,
    isOnline,
    lastSyncTime,
    forceSyncThreads,
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
