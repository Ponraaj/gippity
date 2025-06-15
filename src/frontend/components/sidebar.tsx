import { useState, useEffect } from "react";
import { Search, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { useChat } from "../context/chat-context";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Use the same interface as in your chat context
interface Thread {
  _id: Id<"threads">;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const { signOut } = useAuthActions();
  const user = useQuery(api.queries.getCurrentUser);

  const {
    threads,
    currentThread,
    createNewChat,
    selectChat,
    deleteChat,
    searchQuery,
    setSearchQuery,
  } = useChat();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredThreads = threads.filter((thread: Thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedThreads = mounted
    ? filteredThreads.reduce(
        (groups: Record<string, Thread[]>, thread: Thread) => {
          const now = new Date();
          const threadDate = new Date(thread.updatedAt);
          const diffTime = now.getTime() - threadDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let group = "Older";
          if (diffDays <= 1) group = "Today";
          else if (diffDays <= 7) group = "This Week";
          else if (diffDays <= 30) group = "This Month";

          if (!groups[group]) groups[group] = [];
          groups[group].push(thread);
          return groups;
        },
        {} as Record<string, Thread[]>,
      )
    : { Recent: filteredThreads };

  const handleDeleteChat = async (
    e: React.MouseEvent,
    threadId: Id<"threads">,
  ) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      deleteChat(threadId);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
          "text-foreground fixed inset-y-0 left-0 z-50 w-64 border-r-0 bg-[#2a2430] transition-transform duration-300 ease-in-out lg:relative",
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
                className="bg-input placeholder:text-muted-foreground pl-10"
              />
            </div>
          </div>

          {/* Chat History */}
          <ScrollArea className="custom-scrollbar flex-1 px-4">
            <div className="space-y-4">
              {/* Loading state */}
              {!mounted && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  Loading conversations...
                </div>
              )}

              {/* Thread groups */}
              {mounted &&
                Object.entries(groupedThreads).map(([group, threadList]) => (
                  <div key={group}>
                    <h3 className="text-muted-foreground mb-2 px-2 text-xs font-medium">
                      {group}
                    </h3>
                    <div className="space-y-1">
                      {threadList.map((thread: Thread) => (
                        <div
                          key={thread._id}
                          className={cn(
                            "group relative flex items-center rounded-md",
                            currentThread?._id === thread._id && "bg-secondary",
                          )}
                        >
                          <Button
                            variant="ghost"
                            className={cn(
                              "text-foreground h-auto w-full flex-1 justify-start p-2 pr-8 text-left text-sm font-normal",
                              currentThread?._id === thread._id &&
                                "bg-secondary text-secondary-foreground",
                            )}
                            onClick={() => selectChat(thread._id)}
                          >
                            <div className="truncate">{thread.title}</div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive hover:text-destructive-foreground absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteChat(e, thread._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Empty states */}
              {mounted && filteredThreads.length === 0 && searchQuery && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  No threads found
                </div>
              )}
              {mounted && threads.length === 0 && !searchQuery && (
                <div className="text-muted-foreground py-4 text-center text-sm">
                  No conversations yet
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Profile Section */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : user?.email?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-foreground text-sm font-medium">
                  {user?.name || user?.email || "User"}
                </div>
                <div className="text-muted-foreground text-xs">Free</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSignOut}
                title="Sign out"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
