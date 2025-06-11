import { Sparkles, BookOpen, Code2, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/button";
import { useChat } from "../contexts/chat-context";

const suggestions = [
  "How does AI work?",
  "Are black holes real?",
  "How many Rs are in the word 'strawberry'?",
  "What is the meaning of life?",
];

const actionButtons = [
  { icon: Sparkles, label: "Create", color: "text-purple-500" },
  { icon: BookOpen, label: "Explore", color: "text-blue-500" },
  { icon: Code2, label: "Code", color: "text-green-500" },
  { icon: GraduationCap, label: "Learn", color: "text-orange-500" },
];

export function WelcomeScreen() {
  const { sendMessage } = useChat();

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <h1 className="text-foreground mb-4 text-4xl font-semibold">
          How can I help you, Code?
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="mb-12 flex gap-4">
        {actionButtons.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="bg-card hover:bg-accent flex h-auto flex-col items-center gap-2 px-6 py-4"
          >
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-md space-y-3">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="ghost"
            className="bg-card hover:bg-accent border-border h-auto w-full justify-start border p-4 text-left"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className="text-muted-foreground text-sm">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
