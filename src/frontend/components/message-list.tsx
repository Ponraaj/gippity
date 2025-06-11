import { Message } from "../contexts/chat-context";
import { MessageBubble } from "../components/message-bubble";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  );
}
