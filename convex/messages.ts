import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createMessage = mutation({
  args: {
    threadId: v.id("threads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    model: v.optional(v.string()),
    isStreaming: v.boolean(),
    tokenCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("messages", {
      ...args,
      createdAt: now,
      updatedAt: now,
      isStreaming: true,
    });
  },
});

export const appendMessageChunk = mutation({
  args: {
    messageId: v.id("messages"),
    contentChunk: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const updatedContent = message.content + args.contentChunk;
    await ctx.db.patch(args.messageId, {
      content: updatedContent,
      updatedAt: now,
    });
  },
});

export const finalizeMessage = mutation({
  args: {
    messageId: v.id("messages"),
    tokenCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    await ctx.db.patch(args.messageId, {
      isStreaming: false,
      tokenCount: args.tokenCount ? args.tokenCount : 0,
      updatedAt: now,
    });
  },
});

export const saveMessage = mutation({
  args: {
    messageId: v.id("messages"),
    threadId: v.id("threads"),
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    tokenCount: v.optional(v.number()),
    isStreaming: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      // If message doesn't exist, create it
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthorized");
      
      return await ctx.db.insert("messages", {
        ...args,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing message
      await ctx.db.patch(args.messageId, {
        ...args,
        updatedAt: now,
      });
      return args.messageId;
    }
  },
});
