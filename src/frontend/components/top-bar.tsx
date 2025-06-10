"use client";

import { Menu, Sidebar, Share, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from 'next-themes';

interface TopBarProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export function TopBar({ onSidebarToggle, sidebarOpen }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="h-12 bg-topbar border-b border-border flex items-center justify-between px-4 relative z-50">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="h-8 w-8 text-topbar-foreground hover:bg-white/10"
        >
          {sidebarOpen ? <Sidebar className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-topbar-foreground hover:bg-white/10"
        >
          <Share className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-8 w-8 text-topbar-foreground hover:bg-white/10"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </div>
  );
}
