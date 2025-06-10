"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { useChat } from '../contexts/chat-context';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const { 
    chatHistories, 
    currentChat, 
    createNewChat, 
    selectChat, 
    searchQuery, 
    setSearchQuery 
  } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredChats = chatHistories.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = mounted ? filteredChats.reduce((groups, chat) => {
    const now = new Date();
    const chatDate = new Date(chat.updatedAt);
    const diffTime = now.getTime() - chatDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let group = 'Older';
    if (diffDays <= 1) group = 'Today';
    else if (diffDays <= 7) group = 'This Week';
    else if (diffDays <= 30) group = 'This Month';

    if (!groups[group]) groups[group] = [];
    groups[group].push(chat);
    return groups;
  }, {} as Record<string, typeof chatHistories>) : { 'Recent': filteredChats };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-primary">Gippity</h1>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button 
              onClick={createNewChat}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 px-4 custom-scrollbar">
            <div className="space-y-4">
              {Object.entries(groupedChats).map(([group, chats]) => (
                <div key={group}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <Button
                        key={chat.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-left h-auto p-2 text-sm font-normal",
                          currentChat?.id === chat.id && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => selectChat(chat.id)}
                      >
                        <div className="truncate">{chat.title}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Profile Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  CM
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium">Code Mavericks</div>
                <div className="text-xs text-muted-foreground">Free</div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
