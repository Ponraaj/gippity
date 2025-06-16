import { useState, useEffect } from "react";
import { Search, Plus, X, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Avatar, AvatarImage } from "../components/ui/avatar";
import { useChat } from "../context/chat-context";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import type { Id } from "../../../convex/_generated/dataModel";
import { useTheme } from "next-themes";
import { SettingsDialog } from "../components/settings-dialog";

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

  const { theme } = useTheme();
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

  const filteredChats = threads.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedThreads = mounted
    ? filteredChats.reduce(
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
    : { Recent: filteredChats };

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
      {/* Mobile overlay - only shown when sidebar is open on non-large screens */}
      {isOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar main container */}
      <div
        className={cn(
          "flex flex-col  transition-all duration-300 ease-in-out h-full",
          // Mobile (non-lg) styles - fixed overlay behavior
          "fixed inset-y-0 z-50",
          isOpen ? "translate-x-0 w-72" : "-translate-x-full w-72",

          // Desktop (lg and up) styles - part of flex layout, dynamic width
          "lg:static lg:h-full",
          isOpen ? "lg:w-72" : "lg:w-0 lg:overflow-hidden",
          "lg:translate-x-0",
        )}
        style={{ backgroundColor: isOpen && theme === "light" ? "#f3e5f5" : "#140f13" }}
      >
        <div 
          className="flex h-full flex-col"
          style={{ backgroundColor: theme === "light" ? "#f3e5f5" : "#140f13" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-1 items-center justify-center gap-2">
              <h1 
                className="text-2xl font-semibold"
                style={{ color: theme === "light" ? "#c66198" : undefined }}
              >Gippity</h1>
            </div>
            {/* Close button only visible on non-large screens */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              style={{
                backgroundColor: theme === "light" ? "#a84470" : undefined,
              }}
            >
              <X className="h-5 w-5" style={{ color: theme === "light" ? "white" : undefined }}/>
            </Button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              onClick={createNewChat}
              className="w-full"
              size="sm"
              style={{
                backgroundColor: theme === "light" ? "#a84470" : undefined,
                color: theme === "light" ? "white" : undefined,
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <Search 
                className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                style={{ color: theme === "light" ? "#c66198" : undefined }}
              />
              <Input
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{
                  backgroundColor: theme === "light" ? "#fbeff8" : undefined,
                  color: theme === "light" ? "#77347b" : undefined,
                }}
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
                              "h-auto w-full flex-1 justify-start p-2 pr-8 text-left text-sm font-normal",
                              currentThread?._id === thread._id && "bg-secondary",
                            )}
                            style={{
                              backgroundColor: theme === "light" ? "#fbeff8" : "#2a2430",
                              color: theme === "light" ? "#77347b" : undefined,
                            }}
                            onClick={() => selectChat(thread._id)}
                          >
                            <div className="truncate">{thread.title}</div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive hover:text-destructive-foreground absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteChat(e, thread._id)}
                            style={{
                              backgroundColor: theme === "light" ? "#f3e5f5" : "#2a2430",
                              color: theme === "light" ? "#77347b" : undefined,
                            }}
                          >
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Empty states */}
              {mounted && filteredChats.length === 0 && searchQuery && (
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
              <AvatarImage src={user?.image} alt={user?.name || "User"} />
              </Avatar>
              <div className="flex-1">
                <div className="text-foreground text-sm font-medium">
                  {user?.name || user?.email || "User"}
                </div>
                <div className="text-muted-foreground text-xs">Free</div>
              </div>
              <SettingsDialog />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  backgroundColor: theme === "light" ? "#a84470" : "#2a2430",
                  color: theme === "light" ? "white" : undefined,
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
