import Dexie, { Table } from "dexie";
import type { Id } from "../../convex/_generated/dataModel";

export interface CachedMessage {
  _id: Id<"messages">;
  _creationTime: number;
  threadId: Id<"threads">;
  userId: Id<"users">;
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming: boolean;
  tokenCount?: number;
  model?: string;
  createdAt: number;
  updatedAt: number;
  // Cache metadata
  cachedAt: number;
  version: number;
}

export interface CachedThread {
  _id: Id<"threads">;
  _creationTime: number;
  title: string;
  userId: Id<"users">;
  createdAt: number;
  updatedAt: number;
  // Cache metadata
  cachedAt: number;
  version: number;
  lastMessageAt?: number;
}

export interface CacheMetadata {
  key: string;
  lastSync: number;
  version: number;
  userId: Id<"users">;
}

export class ChatDatabase extends Dexie {
  messages!: Table<CachedMessage>;
  threads!: Table<CachedThread>;
  metadata!: Table<CacheMetadata>;

  constructor() {
    super("ChatDatabase");

    this.version(1).stores({
      messages: "_id, threadId, userId, createdAt, cachedAt, version",
      threads: "_id, userId, updatedAt, cachedAt, version, lastMessageAt",
      metadata: "key, userId, lastSync, version",
    });

    // Add hooks for data validation and cleanup
    this.messages.hook("creating", (primKey, obj, trans) => {
      obj.cachedAt = Date.now();
      obj.version = obj.version || 1;
    });

    this.threads.hook("creating", (primKey, obj, trans) => {
      obj.cachedAt = Date.now();
      obj.version = obj.version || 1;
    });
  }

  // Clean up old cache entries (older than 7 days)
  async cleanupOldCache() {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    await this.transaction(
      "rw",
      [this.messages, this.threads, this.metadata],
      async () => {
        await this.messages.where("cachedAt").below(weekAgo).delete();
        await this.threads.where("cachedAt").below(weekAgo).delete();
        await this.metadata.where("lastSync").below(weekAgo).delete();
      },
    );
  }

  // Clear all cache for a specific user (useful for logout)
  async clearUserCache(userId: Id<"users">) {
    await this.transaction(
      "rw",
      [this.messages, this.threads, this.metadata],
      async () => {
        await this.messages.where("userId").equals(userId).delete();
        await this.threads.where("userId").equals(userId).delete();
        await this.metadata.where("userId").equals(userId).delete();
      },
    );
  }

  // Get cache statistics
  async getCacheStats(userId: Id<"users">) {
    const messageCount = await this.messages
      .where("userId")
      .equals(userId)
      .count();
    const threadCount = await this.threads
      .where("userId")
      .equals(userId)
      .count();
    const totalSize = await this.messages
      .where("userId")
      .equals(userId)
      .toArray()
      .then((messages) =>
        messages.reduce((size, msg) => size + msg.content.length, 0),
      );

    return {
      messageCount,
      threadCount,
      totalSize,
      lastCleanup: Date.now(),
    };
  }
}

export const db = new ChatDatabase();
