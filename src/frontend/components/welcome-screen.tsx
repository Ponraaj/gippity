import { useChat } from "../context/chat-context"; // adjust path
import { Sparkles, BookOpen, Code2, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";

const suggestions = [
  "How does AI work?",
  "Are black holes real?",
  "How many Rs are in the word 'strawberry'?",
  "What is the meaning of life?",
];

const actionButtons = [
  { icon: Sparkles, label: "Create" },
  { icon: BookOpen, label: "Explore" },
  { icon: Code2, label: "Code" },
  { icon: GraduationCap, label: "Learn" },
];

export function WelcomeScreen() {
  const { append, isLoading } = useChat();
  const { theme } = useTheme();

  const handleSuggestionClick = async (text: string) => {
    try {
      await append({ role: "user", content: text });
    } catch (error) {
      console.error("Failed to send suggestion:", error);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center p-8 text-center">
      <h1
        className="mb-8 text-4xl font-semibold"
        style={{ color: theme === "light" ? "#c66198" : undefined }}
      >
        How can I help you today?
      </h1>

      <div className="mb-12 flex gap-4">
        {actionButtons.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex h-auto flex-col items-center gap-2 px-6 py-4"
            style={{
              backgroundColor: theme === "light" ? "#f3e5f5" : "#2a2430",
              borderColor: theme === "light" ? "#a84470" : "#3a333d",
            }}
          >
            <action.icon
              className="h-6 w-6"
              style={{
                color: theme === "light" ? "#c66198" : undefined,
              }}
            />
            <span
              className="text-sm font-medium"
              style={{
                color: theme === "light" ? "#77347b" : undefined,
              }}
            >
              {action.label}
            </span>
          </Button>
        ))}
      </div>

      <div className="w-full max-w-md space-y-3">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="ghost"
            className="h-auto w-full justify-start p-4 text-left"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
            style={{
              backgroundColor: theme === "light" ? "#fbeff8" : "#221d27",
            }}
          >
            <span
              className="text-sm"
              style={{
                color: theme === "light" ? "#77347b" : undefined,
              }}
            >
              {suggestion}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}