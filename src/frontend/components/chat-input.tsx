import { useState, useRef } from "react";
import { Send, Paperclip, Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Toggle } from "../components/ui/toggle";
import { useChat } from "../contexts/chat-context";
import { toast } from "sonner";

const models = [
  "Gemini 2.5 Flash",
  "GPT-4",
  "Claude 3.5 Sonnet",
  "GPT-3.5 Turbo",
];

export function ChatInput() {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sendMessage,
    isLoading,
    selectedModel,
    setSelectedModel,
    webSearchEnabled,
    setWebSearchEnabled,
  } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(message, attachments);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      toast.success(`${files.length} file(s) attached`);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="p-4">
      <div className="mx-auto max-w-4xl">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="bg-secondary text-primary flex items-center gap-2 rounded-lg px-3 py-1 text-sm"
              >
                <Paperclip className="h-3 w-3 text-primary-foreground" />
                {file.name}
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:bg-destructive hover:text-destructive-foreground h-4 w-4 p-0"
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="bg-card border-card focus-within:ring-primary relative rounded-2xl border p-3 focus-within:ring-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="max-h-[200px] min-h-[20px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-primary-foreground"
              rows={1}
            />

            <div className="border-primary bg-card mt-3 flex items-center justify-between border-t-0 pt-3">
              {/* Left side controls */}
              <div className="flex items-center gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-8 w-[160px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model} value={model} className="text-sm">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Toggle
                  pressed={webSearchEnabled}
                  onPressedChange={setWebSearchEnabled}
                  size="sm"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 px-3 hover:bg-primary/80 hover:text-primary-foreground"
                >
                  <Search className="mr-1 h-3 w-3" />
                  Search
                </Toggle>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleFileAttachment}
                >
                  <Paperclip className="h-4 w-4 text-primary-foreground" />
                </Button>
              </div>

              {/* Send button */}
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 w-9 p-0"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="*/*"
        />
      </div>
    </div>
  );
}
