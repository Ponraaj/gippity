import { useState, useEffect } from "react";
import { Search, Plus, Settings } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useChat } from "../contexts/chat-context";
import { cn } from "../../lib/utils";

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
    setSearchQuery,
  } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredChats = chatHistories.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedChats = mounted
    ? filteredChats.reduce(
        (groups, chat) => {
          const now = new Date();
          const chatDate = new Date(chat.updatedAt);
          const diffTime = now.getTime() - chatDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let group = "Older";
          if (diffDays <= 1) group = "Today";
          else if (diffDays <= 7) group = "This Week";
          else if (diffDays <= 30) group = "This Month";

          if (!groups[group]) groups[group] = [];
          groups[group].push(chat);
          return groups;
        },
        {} as Record<string, typeof chatHistories>,
      )
    : { Recent: filteredChats };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-[#2a2430] fixed inset-y-0 left-0 z-50 w-64 border-r-0 transition-transform duration-300 ease-in-out lg:relative text-foreground",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Gippity</h1>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={createNewChat}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input pl-10 placeholder:text-primary-foreground"
              />
            </div>
          </div>

          {/* Chat History */}
          <ScrollArea className="custom-scrollbar flex-1 px-4">
            <div className="space-y-4">
              {Object.entries(groupedChats).map(([group, chats]) => (
                <div key={group}>
                  <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                    {group}
                  </h3>
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <Button
                        key={chat.id}
                        variant="ghost"
                        className={cn(
                          "h-auto w-full justify-start p-2 text-left text-sm font-normal text-foreground",
                          currentChat?.id === chat.id &&
                            "bg-secondary text-secondary-foreground",
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
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  CM
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-foreground text-sm font-medium">Code Mavericks</div>
                <div className="text-muted-foreground text-xs">Free</div>
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
