import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,

  apiKeys: defineTable({
    userId: v.id("users"),
    provider: v.string(), // "openai", "anthropic", "google", "cohere", etc.
    encryptedApiKey: v.string(),
    keyName: v.optional(v.string()), // Optional friendly name for the key
    isActive: v.boolean(), // Allow users to disable keys without deleting
    isDefault: v.optional(v.boolean()), // Mark one key per provider as default
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"])
    .index("by_userId_active", ["userId", "isActive"]),

  threads: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    model: v.optional(v.string()), // Specific model used
    tokenCount: v.optional(v.number()),
    isStreaming: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"]),
});

export default schema;
