import { Menu, Sidebar, Share, Sun, Moon } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";
import { useAuthActions } from "@convex-dev/auth/react";

interface TopBarProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export function TopBar({ onSidebarToggle, sidebarOpen }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { signIn, signOut } = useAuthActions();
  const isAuthenticated = false; // Replace with real auth state
  const user = { name: "User Name" }; // Replace with real user info

  return (
    <div className="bg-topbar relative z-50 bg-[#140f13] flex h-12 items-center justify-between px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          className="text-topbar-foreground h-8 w-8 hover:bg-white/10"
        >
          {sidebarOpen ? (
            <Sidebar className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-topbar-foreground h-8 w-8 hover:bg-white/10"
        >
          <Share className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="text-topbar-foreground h-8 w-8 hover:bg-white/10"
        >
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>

        {/* Login/Logout or User Name Button */}
        {isAuthenticated ? (
          <Button
            variant="ghost"
            className="text-topbar-foreground"
            onClick={() => signOut()}
          >
            {user.name}
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-topbar-foreground"
            onClick={() => signIn("google")}
          >
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}
