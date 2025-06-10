"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  currentChat: ChatHistory | null;
  chatHistories: ChatHistory[];
  messages: Message[];
  isLoading: boolean;
  searchQuery: string;
  selectedModel: string;
  webSearchEnabled: boolean;
  createNewChat: () => void;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  selectChat: (chatId: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedModel: (model: string) => void;
  setWebSearchEnabled: (enabled: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentChat, setCurrentChat] = useState<ChatHistory | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Greeting Response',
      messages: [],
      createdAt: new Date('2023-10-26T10:00:00.000Z'),
      updatedAt: new Date('2023-10-26T10:00:00.000Z'),
    },
    {
      id: '2',
      title: 'Invert Binary Search Tree in Python',
      messages: [],
      createdAt: new Date('2023-10-26T10:00:00.000Z'),
      updatedAt: new Date('2023-10-26T10:00:00.000Z'),
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const createNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCurrentChat(newChat);
    setMessages([]);
    setChatHistories(prev => [newChat, ...prev]);
  };

  const sendMessage = async (content: string, attachments?: File[]) => {
    if (!content.trim()) return;
    console.log(attachments)
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateMockResponse(content),
        role: 'assistant',
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update current chat
      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          messages: finalMessages,
          title: finalMessages.length === 2 ? content.slice(0, 50) + (content.length > 50 ? '...' : '') : currentChat.title,
          updatedAt: new Date(),
        };
        setCurrentChat(updatedChat);
        setChatHistories(prev => 
          prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
        );
      }

      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const selectChat = (chatId: string) => {
    const chat = chatHistories.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      setMessages(chat.messages);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const responses = [
      `I understand you're asking about "${userInput}". Let me help you with that.

This is a comprehensive response that includes both explanation and code examples.

## Code Example

Here's a sample implementation:

\`\`\`javascript
// example.js
function processUserInput(input) {
  console.log('Processing:', input);
  
  // Perform some processing
  const result = input
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  return result;
}

// Usage
const processed = processUserInput("${userInput}");
console.log('Result:', processed);
\`\`\`

This function demonstrates how to process text input by:
1. Converting to lowercase
2. Splitting into words
3. Capitalizing each word
4. Joining back together

The time complexity is O(n) where n is the length of the input string.`,

      `Great question about "${userInput}"! Let me break this down for you.

## Understanding the Concept

The topic you're asking about involves several key principles:

- **First principle**: This relates to the fundamental concept
- **Second principle**: This builds upon the first
- **Third principle**: This ties everything together

## Practical Implementation

\`\`\`python
# solution.py
class DataProcessor:
    def __init__(self, data):
        self.data = data
        self.processed = False
    
    def process(self):
        """Process the input data according to requirements."""
        if not self.data:
            return None
            
        # Apply transformation logic
        result = []
        for item in self.data:
            transformed = self._transform_item(item)
            result.append(transformed)
            
        self.processed = True
        return result
    
    def _transform_item(self, item):
        # Custom transformation logic here
        return item.upper() if isinstance(item, str) else item

# Example usage
processor = DataProcessor(['hello', 'world', 'example'])
result = processor.process()
print(f"Processed data: {result}")
\`\`\`

This approach ensures clean, maintainable code with clear separation of concerns.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <ChatContext.Provider
      value={{
        currentChat,
        chatHistories,
        messages,
        isLoading,
        searchQuery,
        selectedModel,
        webSearchEnabled,
        createNewChat,
        sendMessage,
        selectChat,
        setSearchQuery,
        setSelectedModel,
        setWebSearchEnabled,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
