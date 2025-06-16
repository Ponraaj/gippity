import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

interface APIKey {
  name: string;
  key: string;
  description: string;
}

export function SettingsDialog() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      name: "OpenAI",
      key: "",
      description: "Used for GPT-3.5, GPT-4, and other OpenAI models"
    },
    {
      name: "Gemini",
      key: "",
      description: "Used for Google's Gemini models"
    },
    {
      name: "Claude",
      key: "",
      description: "Used for Anthropic's Claude models"
    },
    {
      name: "Mistral",
      key: "",
      description: "Used for Mistral AI models"
    },
    {
      name: "Cohere",
      key: "",
      description: "Used for Cohere's language models"
    },
    {
      name: "HuggingFace",
      key: "",
      description: "Used for HuggingFace's models and APIs"
    }
  ]);
  const { theme } = useTheme();

  const handleKeyChange = (index: number, value: string) => {
    const newApiKeys = [...apiKeys];
    newApiKeys[index].key = value;
    setApiKeys(newApiKeys);
  };

  const handleSave = () => {
    // Save all API keys to secure storage
    apiKeys.forEach(({ name, key }) => {
      localStorage.setItem(`${name.toLowerCase()}_key`, key);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          style={{ backgroundColor: theme === "light" ? "#a84470" : undefined }}
        >
          <Settings className="h-4 w-4" 
            style={{ color: theme === "light" ? "white" : undefined }}
          />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        style={{
          backgroundColor: theme === "light" ? "#f3e5f5" : "#1a1620",
          borderColor: theme === "light" ? "#a84470" : "#2a2430",
        }}
      >
        <DialogHeader>
          <DialogTitle 
            style={{ color: theme === "light" ? "#c66198" : undefined }}
          >API Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {apiKeys.map((apiKey, index) => (
            <div 
              key={apiKey.name} 
              className="grid gap-2 p-4 rounded-lg border"
              style={{
                backgroundColor: theme === "light" ? "#fbeff8" : "#221d27",
                borderColor: theme === "light" ? "#a84470" : "#2a2430",
              }}
            >
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor={`${apiKey.name.toLowerCase()}-key`} 
                  className="text-base font-medium"
                  style={{ color: theme === "light" ? "#77347b" : undefined }}
                >
                  {apiKey.name}
                </Label>
                <span className="text-sm text-muted-foreground"
                  style={{ color: theme === "light" ? "#c66198" : undefined }}
                >{apiKey.description}</span>
              </div>
              <Input
                id={`${apiKey.name.toLowerCase()}-key`}
                type="password"
                value={apiKey.key}
                onChange={(e) => handleKeyChange(index, e.target.value)}
                placeholder={`Enter your ${apiKey.name} API key`}
                className="w-full text-almost-white-pink placeholder:text-muted-foreground focus:border-medium-purple"
                style={{
                  backgroundColor: theme === "light" ? "#f3e5f5" : "#2a2430",
                  borderColor: theme === "light" ? "#a84470" : "#2a2430",
                  color: theme === "light" ? "#77347b" : undefined,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            className="text-almost-white-pink hover:bg-medium-purple/90"
            style={{
              backgroundColor: theme === "light" ? "#a84470" : "#9333ea",
              color: theme === "light" ? "white" : undefined,
            }}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 