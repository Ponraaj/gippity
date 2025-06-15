import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, smoothStream } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const maxDuration = 60;
export const runtime = "edge";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function generateTitle(messages: any[]): string {
  const firstUserMessage = messages.find((msg) => msg.role === "user");
  if (!firstUserMessage) return "New Conversation";

  const content = firstUserMessage.content;
  return content.length > 50 ? content.substring(0, 50) + "..." : content;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, userId, threadId } = await req.json();

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const aiModel = google("gemini-2.0-flash");

    let currentThreadId = threadId;
    let messageId: Id<"messages"> | null = null;
    let accumulatedContent = "";
    let chunkBuffer = "";
    const CHUNK_SIZE = 50;

    if (!currentThreadId) {
      const title = generateTitle(messages);
      currentThreadId = await convex.mutation(api.threads.createThread, {
        userId,
        title,
      });
    }

    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      await convex.mutation(api.messages.createMessage, {
        threadId: currentThreadId,
        userId,
        role: "user",
        content: userMessage.content,
        model,
        isStreaming: false,
        tokenCount: userMessage.content.split(" ").length,
      });
    }

    messageId = await convex.mutation(api.messages.createMessage, {
      threadId: currentThreadId,
      userId,
      role: "assistant",
      content: "",
      model,
      isStreaming: true,
      tokenCount: 0,
    });

    const result = streamText({
      model: aiModel,
      messages,
      onError: (error) => {
        console.log("error", error);
      },
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta" && messageId) {
          const delta = chunk.textDelta;
          accumulatedContent += delta;
          chunkBuffer += delta;

          if (chunkBuffer.length >= CHUNK_SIZE) {
            const chunkToSend = chunkBuffer;
            chunkBuffer = ""; // Reset buffer immediately

            convex
              .mutation(api.messages.appendMessageChunk, {
                messageId,
                contentChunk: chunkToSend,
              })
              .catch((error) => {
                console.error("Error saving chunk to Convex:", error);
              });
          }
        }
      },
      onFinish: async ({ text, finishReason, usage }) => {
        try {
          // Send any remaining buffer content
          if (chunkBuffer.length > 0 && messageId) {
            await convex.mutation(api.messages.appendMessageChunk, {
              messageId,
              contentChunk: chunkBuffer,
            });
          }

          // Finalize the message
          if (messageId) {
            const tokenCount = usage?.totalTokens || text.split(" ").length;
            await convex.mutation(api.messages.finalizeMessage, {
              messageId,
              tokenCount,
            });
          }
        } catch (error) {
          console.error("Error finalizing message in Convex:", error);
        }
      },
      system: `
      You are a helpful ai assistant that can answer questions and help with tasks.
      Be helpful and provide relevant information
      Be respectful and polite in all interactions.
      Be engaging and maintain a conversational tone.
      Always use LaTeX for mathematical expressions - 
      Inline math must be wrapped in single dollar signs: $content$
      Display math must be wrapped in double dollar signs: $content$
      Display math should be placed on its own line, with nothing else on that line.
      Do not nest math delimiters or mix styles.
      Examples:
      - Inline: The equation $E = mc^2$ shows mass-energy equivalence.
      - Display: 
      $\\frac{d}{dx}\\sin(x) = \\cos(x)$
      `,
      experimental_transform: [smoothStream({ chunking: "word" })],
      abortSignal: req.signal,
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
      getErrorMessage: (error) => {
        return (error as { message: string }).message;
      },
      headers: {
        "X-Thread-ID": currentThreadId,
        "X-Message-ID": messageId || "",
      },
    });
  } catch (error) {
    console.log("error", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
