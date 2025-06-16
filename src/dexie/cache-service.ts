import { db, type CachedMessage, type CachedThread } from "./db";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export class CacheService {
  private convex: ConvexHttpClient;
  private threadSyncInProgress = new Map<string, Promise<CachedThread[]>>();
  private messageSyncInProgress = new Map<string, Promise<CachedMessage[]>>();
  private pendingMessages = new Map<string, CachedMessage>(); // Store messages before thread creation
  private messageWatchers = new Map<
    string,
    Set<(messages: CachedMessage[]) => void>
  >();
  private threadWatchers = new Map<
    string,
    Set<(threads: CachedThread[]) => void>
  >();
  private messageUpdateTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
  }

  // Get cached threads with smart fallback to Convex
  async getThreads(
    userId: Id<"users">,
    forceRefresh = false,
  ): Promise<CachedThread[]> {
    const cacheKey = `threads_${userId}`;

    // If sync is already in progress, return the same promise
    if (this.threadSyncInProgress.has(cacheKey)) {
      return await this.threadSyncInProgress.get(cacheKey)!;
    }

    if (!forceRefresh) {
      const cached = await db.threads.where("userId").equals(userId).toArray();

      if (cached.length > 0) {
        // Sort manually since we got an array
        cached.sort((a, b) => b.updatedAt - a.updatedAt);

        const lastSync = await this.getLastSync(cacheKey, userId);
        const cacheAge = Date.now() - lastSync;

        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          // Background refresh if cache is older than 2 minutes
          if (cacheAge > 2 * 60 * 1000) {
            this.backgroundSync(() => this.syncThreads(userId));
          }
          return cached;
        }
      }
    }

    // Fetch from Convex and update cache
    return await this.syncThreads(userId);
  }

  // Get cached messages with smart fallback to Convex
  async getMessages(
    threadId: Id<"threads">,
    userId: Id<"users">,
    forceRefresh = false,
  ): Promise<CachedMessage[]> {
    const cacheKey = `messages_${threadId}`;

    // If sync is already in progress, return the same promise
    if (this.messageSyncInProgress.has(cacheKey)) {
      return await this.messageSyncInProgress.get(cacheKey)!;
    }

    if (!forceRefresh) {
      const cached = await db.messages
        .where("threadId")
        .equals(threadId)
        .toArray();

      if (cached.length > 0) {
        // Sort manually since we got an array
        cached.sort((a, b) => a.createdAt - b.createdAt);

        const lastSync = await this.getLastSync(cacheKey, userId);
        const cacheAge = Date.now() - lastSync;

        // Use cache if it's less than 2 minutes old for messages
        if (cacheAge < 2 * 60 * 1000) {
          // Background refresh if cache is older than 1 minute
          if (cacheAge > 1 * 60 * 1000) {
            this.backgroundSync(() => this.syncMessages(threadId, userId));
          }
          return cached;
        }
      }
    }

    // Fetch from Convex and update cache
    return await this.syncMessages(threadId, userId);
  }

  // Store user message before thread creation (for new conversations)
  async cachePendingMessage(
    tempId: string,
    message: Omit<CachedMessage, "threadId">,
  ): Promise<void> {
    const pendingMessage = {
      ...message,
      threadId: "" as Id<"threads">, // Will be set when thread is created
      cachedAt: Date.now(),
      version: 1,
    };

    this.pendingMessages.set(tempId, pendingMessage);
  }

  // Move pending messages to proper thread and cache them
  async finalizePendingMessages(
    threadId: Id<"threads">,
    tempIds: string[],
  ): Promise<void> {
    const messagesToCache: CachedMessage[] = [];

    for (const tempId of tempIds) {
      const pendingMessage = this.pendingMessages.get(tempId);
      if (pendingMessage) {
        pendingMessage.threadId = threadId;
        messagesToCache.push(pendingMessage);
        this.pendingMessages.delete(tempId);
      }
    }

    if (messagesToCache.length > 0) {
      await db.messages.bulkPut(messagesToCache);

      // Notify watchers
      this.notifyMessageWatchers(threadId);

      // Invalidate cache to force fresh sync
      await this.invalidateMessagesCache(threadId);
    }
  }

  // Cache a new message immediately (for optimistic updates)
  async cacheMessage(message: CachedMessage): Promise<void> {
    const cachedMessage = {
      ...message,
      cachedAt: Date.now(),
      version: 1,
    };

    await db.messages.put(cachedMessage);

    // Update thread's lastMessageAt
    const thread = await db.threads.get(message.threadId);
    if (thread) {
      await db.threads.update(message.threadId, {
        lastMessageAt: message.createdAt,
        updatedAt: Date.now(),
        cachedAt: Date.now(),
      });
    }

    // Notify watchers
    this.notifyMessageWatchers(message.threadId);

    // Background sync to server
    this.backgroundSync(() => this.syncMessageToServer(message));
  }

  // Update message content during streaming with debouncing
  async updateMessageContent(
    messageId: Id<"messages">,
    content: string,
    isStreaming = true,
  ): Promise<void> {
    const existing = await db.messages.get(messageId);
    if (!existing) return;

    // Clear any existing timeout for this message
    const existingTimeout = this.messageUpdateTimeouts.get(messageId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set a new timeout for the update
    const timeout = setTimeout(async () => {
      try {
        // Always update Dexie first
        await db.messages.update(messageId, {
          content,
          isStreaming,
          updatedAt: Date.now(),
          cachedAt: Date.now(),
        });

        // Notify watchers immediately
        this.notifyMessageWatchers(existing.threadId);

        // Only sync to Convex if this is the final update
        if (!isStreaming) {
          const updatedMessage = await db.messages.get(messageId);
          if (updatedMessage) {
            // Queue the sync to Convex
            this.backgroundSync(() => this.syncMessageToServer(updatedMessage));
          }
        }
      } catch (error) {
        console.error("Error updating message content:", error);
      } finally {
        this.messageUpdateTimeouts.delete(messageId);
      }
    }, isStreaming ? 100 : 0); // Debounce streaming updates, but not final updates

    this.messageUpdateTimeouts.set(messageId, timeout);
  }

  // Finalize message (mark as not streaming) and sync to server
  async finalizeMessage(
    messageId: Id<"messages">,
    tokenCount?: number,
  ): Promise<void> {
    const existing = await db.messages.get(messageId);
    if (!existing) return;

    // Clear any pending update timeout
    const existingTimeout = this.messageUpdateTimeouts.get(messageId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.messageUpdateTimeouts.delete(messageId);
    }

    try {
      // Update Dexie first
      await db.messages.update(messageId, {
        isStreaming: false,
        tokenCount,
        updatedAt: Date.now(),
        cachedAt: Date.now(),
      });

      // Notify watchers
      this.notifyMessageWatchers(existing.threadId);

      // Get the final message state
      const updatedMessage = await db.messages.get(messageId);
      if (updatedMessage) {
        // Queue the sync to Convex
        this.backgroundSync(() => this.syncMessageToServer(updatedMessage));
      }
    } catch (error) {
      console.error("Error finalizing message:", error);
      throw error; // Re-throw to handle in the UI
    }
  }

  // Sync individual message to server
  private async syncMessageToServer(message: CachedMessage): Promise<void> {
    try {
      // Skip if message is still streaming
      if (message.isStreaming) {
        return;
      }

      // Create or update message in Convex
      await this.convex.mutation(api.messages.createMessage, {
        threadId: message.threadId,
        content: message.content,
        role: message.role,
        tokenCount: message.tokenCount ?? 0,
        isStreaming: false,
        userId: message.userId,
      });
    } catch (error: unknown) {
      console.error("Failed to sync message to server:", error);
      // Could implement retry logic here
    }
  }

  // Cache a new thread
  async cacheThread(thread: CachedThread): Promise<void> {
    const cachedThread = {
      ...thread,
      cachedAt: Date.now(),
      version: 1,
    };

    await db.threads.put(cachedThread);

    // Notify watchers
    this.notifyThreadWatchers(thread.userId);

    // Background sync to server
    this.backgroundSync(() => this.syncThreadToServer(cachedThread));
  }

  // Sync individual thread to server
  private async syncThreadToServer(thread: CachedThread): Promise<void> {
    try {
      await this.convex.mutation(api.threads.createThread, {
        title: thread.title,
        userId: thread.userId,
      });
    } catch (error: unknown) {
      console.error("Failed to sync thread to server:", error);
    }
  }

  // Sync threads from Convex to cache with incremental updates
  private async syncThreads(userId: Id<"users">): Promise<CachedThread[]> {
    const cacheKey = `threads_${userId}`;

    // Create and store the sync promise to prevent duplicate syncs
    const syncPromise = this.performThreadSync(userId, cacheKey);
    this.threadSyncInProgress.set(cacheKey, syncPromise);

    try {
      const result = await syncPromise;
      // Notify watchers after sync
      this.notifyThreadWatchers(userId);
      return result;
    } finally {
      this.threadSyncInProgress.delete(cacheKey);
    }
  }

  private async performThreadSync(
    userId: Id<"users">,
    cacheKey: string,
  ): Promise<CachedThread[]> {
    try {
      const threads = await this.convex.query(api.queries.getUserThreads, {
        userId,
      });

      if (threads.length > 0) {
        const cachedThreads: CachedThread[] = threads.map((thread) => ({
          ...thread,
          cachedAt: Date.now(),
          version: 1,
        }));

        // Use incremental update instead of clearing all data
        await db.transaction("rw", [db.threads, db.metadata], async () => {
          // Get existing threads to compare
          const existingThreads = await db.threads
            .where("userId")
            .equals(userId)
            .toArray();

          const newIds = new Set(cachedThreads.map((t) => t._id));

          // Delete threads that no longer exist
          const toDelete = existingThreads.filter((t) => !newIds.has(t._id));
          if (toDelete.length > 0) {
            await db.threads.bulkDelete(toDelete.map((t) => t._id));
          }

          // Update or insert threads
          await db.threads.bulkPut(cachedThreads);
          await this.setLastSync(cacheKey, userId);
        });

        // Return sorted threads
        cachedThreads.sort((a, b) => b.updatedAt - a.updatedAt);
        return cachedThreads;
      }

      await this.setLastSync(cacheKey, userId);
      return [];
    } catch (error: unknown) {
      console.error("Failed to sync threads:", error);
      // Return cached data if sync fails
      const cached = await db.threads.where("userId").equals(userId).toArray();
      cached.sort((a, b) => b.updatedAt - a.updatedAt);
      return cached;
    }
  }

  // Sync messages from Convex to cache with incremental updates
  private async syncMessages(
    threadId: Id<"threads">,
    userId: Id<"users">,
  ): Promise<CachedMessage[]> {
    const cacheKey = `messages_${threadId}`;

    // Create and store the sync promise to prevent duplicate syncs
    const syncPromise = this.performMessageSync(threadId, userId, cacheKey);
    this.messageSyncInProgress.set(cacheKey, syncPromise);

    try {
      const result = await syncPromise;
      // Notify watchers after sync
      this.notifyMessageWatchers(threadId);
      return result;
    } finally {
      this.messageSyncInProgress.delete(cacheKey);
    }
  }

  private async performMessageSync(
    threadId: Id<"threads">,
    userId: Id<"users">,
    cacheKey: string,
  ): Promise<CachedMessage[]> {
    try {
      const messages = await this.convex.query(api.queries.getThreadMessages, {
        threadId,
      });

      if (messages.length > 0) {
        const cachedMessages: CachedMessage[] = messages.map((message) => ({
          ...message,
          cachedAt: Date.now(),
          version: 1,
        }));

        // Use incremental update instead of clearing all data
        await db.transaction("rw", [db.messages, db.metadata], async () => {
          // Get existing messages to compare
          const existingMessages = await db.messages
            .where("threadId")
            .equals(threadId)
            .toArray();

          const newIds = new Set(cachedMessages.map((m) => m._id));

          // Delete messages that no longer exist
          const toDelete = existingMessages.filter((m) => !newIds.has(m._id));
          if (toDelete.length > 0) {
            await db.messages.bulkDelete(toDelete.map((m) => m._id));
          }

          // Update or insert messages
          await db.messages.bulkPut(cachedMessages);
          await this.setLastSync(cacheKey, userId);
        });

        // Return sorted messages
        cachedMessages.sort((a, b) => a.createdAt - b.createdAt);
        return cachedMessages;
      }

      await this.setLastSync(cacheKey, userId);
      return [];
    } catch (error: unknown) {
      console.error("Failed to sync messages:", error);
      // Return cached data if sync fails
      const cached = await db.messages
        .where("threadId")
        .equals(threadId)
        .toArray();
      cached.sort((a, b) => a.createdAt - b.createdAt);
      return cached;
    }
  }

  // Delete thread from cache
  async deleteThread(threadId: Id<"threads">): Promise<void> {
    const thread = await db.threads.get(threadId);

    await db.transaction("rw", [db.threads, db.messages], async () => {
      await db.threads.delete(threadId);
      await db.messages.where("threadId").equals(threadId).delete();
    });

    // Notify watchers
    if (thread) {
      this.notifyThreadWatchers(thread.userId);
    }

    // Background sync deletion to server
    this.backgroundSync(() => this.deleteThreadFromServer(threadId));
  }

  private async deleteThreadFromServer(threadId: Id<"threads">): Promise<void> {
    try {
      await this.convex.mutation(api.threads.deleteThread, { threadId });
    } catch (error) {
      console.error("Failed to delete thread from server:", error);
    }
  }

  // Invalidate cache for specific entities
  async invalidateThreadsCache(userId: Id<"users">): Promise<void> {
    const cacheKey = `threads_${userId}`;
    await db.metadata.where("key").equals(cacheKey).delete();
  }

  async invalidateMessagesCache(threadId: Id<"threads">): Promise<void> {
    const cacheKey = `messages_${threadId}`;
    await db.metadata.where("key").equals(cacheKey).delete();
  }

  // Clear all cache for a user (logout)
  async clearUserCache(userId: Id<"users">): Promise<void> {
    await db.clearUserCache(userId);
    // Clear pending messages for this user
    this.pendingMessages.clear();
  }

  // Background sync without blocking UI
  private backgroundSync(syncFn: () => Promise<unknown>): void {
    setTimeout(() => {
      syncFn().catch((error: unknown) => {
        console.warn("Background sync failed:", error);
      });
    }, 0);
  }

  // Utility methods
  private async getLastSync(key: string, userId: Id<"users">): Promise<number> {
    const metadata = await db.metadata.where("key").equals(key).toArray();
    const userMetadata = metadata.find((m) => m.userId === userId);
    return userMetadata?.lastSync || 0;
  }

  private async setLastSync(key: string, userId: Id<"users">): Promise<void> {
    await db.metadata.put({
      key,
      lastSync: Date.now(),
      version: 1,
      userId,
    });
  }

  // Watch for real-time updates to cached messages
  watchMessages(
    threadId: Id<"threads">,
    callback: (messages: CachedMessage[]) => void,
  ): () => void {
    if (!this.messageWatchers.has(threadId)) {
      this.messageWatchers.set(threadId, new Set());
    }

    this.messageWatchers.get(threadId)!.add(callback);

    // Initial load
    this.loadAndNotifyMessages(threadId, callback);

    // Return cleanup function
    return () => {
      const watchers = this.messageWatchers.get(threadId);
      if (watchers) {
        watchers.delete(callback);
        if (watchers.size === 0) {
          this.messageWatchers.delete(threadId);
        }
      }
    };
  }

  private async loadAndNotifyMessages(
    threadId: Id<"threads">,
    callback: (messages: CachedMessage[]) => void,
  ): Promise<void> {
    try {
      // Get messages from Dexie
      const messages = await db.messages
        .where("threadId")
        .equals(threadId)
        .toArray();
      
      // Sort messages by creation time
      messages.sort((a, b) => a.createdAt - b.createdAt);
      
      // Ensure we have the latest content for streaming messages
      const updatedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (msg.isStreaming) {
            const latest = await db.messages.get(msg._id);
            return latest || msg;
          }
          return msg;
        })
      );

      callback(updatedMessages);
    } catch (error) {
      console.warn("Error loading messages:", error);
    }
  }

  private notifyMessageWatchers(threadId: Id<"threads">): void {
    const watchers = this.messageWatchers.get(threadId);
    if (watchers) {
      watchers.forEach((callback) => {
        this.loadAndNotifyMessages(threadId, callback);
      });
    }
  }

  // Improved thread watching
  watchThreads(
    userId: Id<"users">,
    callback: (threads: CachedThread[]) => void,
  ): () => void {
    if (!this.threadWatchers.has(userId)) {
      this.threadWatchers.set(userId, new Set());
    }

    this.threadWatchers.get(userId)!.add(callback);

    // Initial load
    this.loadAndNotifyThreads(userId, callback);

    // Return cleanup function
    return () => {
      const watchers = this.threadWatchers.get(userId);
      if (watchers) {
        watchers.delete(callback);
        if (watchers.size === 0) {
          this.threadWatchers.delete(userId);
        }
      }
    };
  }

  private async loadAndNotifyThreads(
    userId: Id<"users">,
    callback: (threads: CachedThread[]) => void,
  ): Promise<void> {
    try {
      const threads = await db.threads.where("userId").equals(userId).toArray();
      threads.sort((a, b) => b.updatedAt - a.updatedAt);
      callback(threads);
    } catch (error) {
      console.warn("Error loading threads:", error);
    }
  }

  private notifyThreadWatchers(userId: Id<"users">): void {
    const watchers = this.threadWatchers.get(userId);
    if (watchers) {
      watchers.forEach((callback) => {
        this.loadAndNotifyThreads(userId, callback);
      });
    }
  }

  // Periodic cleanup and optimization
  async performMaintenance(): Promise<void> {
    await db.cleanupOldCache();
    await this.compactCache();
    await this.validateCacheIntegrity();
  }

  // Compact cache by removing duplicate entries
  private async compactCache(): Promise<void> {
    const metadataEntries = await db.metadata.toArray();
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const entry of metadataEntries) {
      const key = `${entry.key}_${entry.userId}`;
      if (seen.has(key)) {
        duplicates.push(entry.key);
      } else {
        seen.add(key);
      }
    }

    if (duplicates.length > 0) {
      await db.metadata.bulkDelete(duplicates);
    }
  }

  // Validate cache integrity
  private async validateCacheIntegrity(): Promise<void> {
    const messages = await db.messages.toArray();
    const threadIds = new Set((await db.threads.toArray()).map((t) => t._id));

    const orphanedMessages = messages.filter((m) => !threadIds.has(m.threadId));

    if (orphanedMessages.length > 0) {
      console.warn(
        `Found ${orphanedMessages.length} orphaned messages, cleaning up...`,
      );
      await db.messages.bulkDelete(orphanedMessages.map((m) => m._id));
    }
  }

  // Get cache statistics
  async getCacheStats(userId: Id<"users">) {
    const [messageCount, threadCount, messages] = await Promise.all([
      db.messages.where("userId").equals(userId).count(),
      db.threads.where("userId").equals(userId).count(),
      db.messages.where("userId").equals(userId).toArray(),
    ]);

    const totalSize = messages.reduce(
      (size, msg) => size + msg.content.length,
      0,
    );
    const averageMessageSize =
      messageCount > 0 ? Math.round(totalSize / messageCount) : 0;

    return {
      messageCount,
      threadCount,
      totalSize,
      averageMessageSize,
      lastCleanup: Date.now(),
      pendingMessages: this.pendingMessages.size,
    };
  }

  // Force sync all data to server (useful for ensuring data consistency)
  async forceSyncAll(userId: Id<"users">): Promise<void> {
    // Get all cached data
    const [threads, messages] = await Promise.all([
      db.threads.where("userId").equals(userId).toArray(),
      db.messages.where("userId").equals(userId).toArray(),
    ]);

    // Sync threads
    for (const thread of threads) {
      await this.syncThreadToServer(thread);
    }

    // Sync messages
    for (const message of messages) {
      await this.syncMessageToServer(message);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);
