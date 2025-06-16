import { useState, useRef } from "react";
import { Send, Paperclip, Square } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { Message } from "ai";
import { useTheme } from "next-themes";

const models = [
  "Gemini 2.5 Flash",
  "GPT-4",
  "Claude 3.5 Sonnet",
  "GPT-3.5 Turbo",
];

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  stop,
  isLoading,
}: ChatInputProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Clear attachments and reset textarea height
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Call the parent's submit handler
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
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

  const handleStop = () => {
    stop();
    toast.info("Generation stopped");
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
                <Paperclip className="text-primary-foreground h-3 w-3" />
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
              className="text-foreground placeholder:text-primary-foreground max-h-[200px] min-h-[20px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={isLoading}
            />

            <div 
              className="mt-3 flex items-center justify-between pt-3"
              style={{
                borderColor: theme === "light" ? "#c66198" : undefined,
              }}
            >
              {/* Left side controls */}
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground bg-muted rounded px-2 py-1 text-sm">
                  Gemini 2.0 Flash
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleFileAttachment}
                  style={{
                    backgroundColor: theme === "light" ? "#f9f3f8" : undefined,
                  }}
                >
                  <Paperclip className="h-4 w-4" 
                    style={{ color: theme === "light" ? "#c66198" : undefined }}
                  />
                </Button>
              </div>

              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleStop}
                  className="h-9 w-9 p-0"
                  style={{
                    backgroundColor: theme === "light" ? "#a84470" : undefined,
                    color: theme === "light" ? "white" : undefined,
                  }}
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                  className=" h-9 w-9 p-0"
                >
                  <Send className="text-primary-foreground h-4 w-4" />
                </Button>
              )}
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
