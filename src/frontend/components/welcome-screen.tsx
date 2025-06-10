"use client";

import { Sparkles, BookOpen, Code2, GraduationCap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useChat } from '../contexts/chat-context';

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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-4 text-foreground">
          How can I help you, Code?
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-12">
        {actionButtons.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 px-6 bg-card hover:bg-accent"
          >
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="space-y-3 w-full max-w-md">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="ghost"
            className="w-full text-left justify-start bg-card hover:bg-accent border border-border p-4 h-auto"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className="text-sm text-muted-foreground">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
