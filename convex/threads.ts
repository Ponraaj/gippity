import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createThread = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      userId: args.userId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) {
      throw new Error("Thread not found or unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the thread
    await ctx.db.delete(args.threadId);
  },
});

export const updateThreadTitle = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) {
      throw new Error("Thread not found or unauthorized");
    }

    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const saveThread = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
    userId: v.id("users"),
    lastMessageAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      // If thread doesn't exist, create it
      return await ctx.db.insert("threads", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing thread
      await ctx.db.patch(args.threadId, {
        ...args,
        updatedAt: now,
      });
      return args.threadId;
    }
  },
});
