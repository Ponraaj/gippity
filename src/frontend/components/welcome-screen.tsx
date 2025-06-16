import { useChat } from "../context/chat-context"; // adjust path
import { Sparkles, BookOpen, Code2, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/button";

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
  const { handleSubmit, setInput, isLoading } = useChat();

  const handleSuggestionClick = async (text: string) => {
    setInput(text);
    handleSubmit(text);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center p-8 text-center">
      <h1 className="text-almost-white-pink mb-8 text-4xl font-semibold">
        How can I help you today?
      </h1>

      <div className="mb-12 flex gap-4">
        {actionButtons.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="bg-light-pink hover:bg-light-pink/80 flex h-auto flex-col items-center gap-2 px-6 py-4"
          >
            <action.icon className="text-deep-purple-burgundy h-6 w-6" />
            <span className="text-deep-purple-burgundy text-sm font-medium">
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
            className="h-auto w-full justify-start bg-[#221d27] p-4 text-left hover:bg-[#221d27]/80"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
          >
            <span className="text-deep-purple-burgundy text-sm">
              {suggestion}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
