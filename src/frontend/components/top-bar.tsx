import { Menu, Share, Sun, Moon } from "lucide-react";
import { Button } from "../components/ui/button";
import { useTheme } from "next-themes";
// import { useAuthActions } from "@convex-dev/auth/react";

interface TopBarProps {
  onSidebarToggle: () => void;
}

export function TopBar({ onSidebarToggle }: TopBarProps) {
  const { theme, setTheme } = useTheme();
 

  return (
    <div className="relative z-50 h-16 w-full" style={{ backgroundColor: theme === "light" ? "#f9f3f8" : "#221d26" }}>
      {/* Background and stylistic elements from provided HTML */}
      <div
        //need to change
        className="absolute inset-x-0 top-0 z-10 box-content overflow-hidden bg-gradient-noise-top/80 backdrop-blur-md transition-[transform,border] ease-snappy blur-fallback:bg-gradient-noise-top max-sm:hidden sm:h-3.5"
        style={{ backgroundColor: theme === "light" ? "#f3e4f5" : "#140f13" }}
      ></div>
      <div className="fixed right-0 top-0 z-20 h-16 w-28 max-sm:hidden" 
        style={{
          clipPath: 'inset(0px 0px 0px 0px)',
          // backgroundColor: theme === "light" ? "#f9f3f8" : undefined,
        }}
      >
          <div className="group pointer-events-none absolute top-3.5 z-10 -mb-8 h-32 w-full origin-top transition-all ease-snappy" style={{boxShadow: '10px -10px 8px 2px hsl(var(--gradient-noise-top))'}}>
              <svg className="absolute -right-8 h-9 origin-top-left skew-x-[30deg] overflow-visible" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 32" xmlSpace="preserve"><line stroke={theme === "light" ? "#f3e4f5" : "hsl(var(--gradient-noise-top))"} strokeWidth="2px" shapeRendering="optimizeQuality" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeMiterlimit="10" x1="1" y1="0" x2="128" y2="0"></line><path className="translate-y-[0.5px]" fill={theme === "light" ? "#f3e4f5" : "hsl(var(--gradient-noise-top))"} shapeRendering="optimizeQuality" strokeWidth="1px" strokeLinecap="round" strokeMiterlimit="10" vectorEffect="non-scaling-stroke" d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0" stroke="hsl(var(--chat-border))"></path></svg>
          </div>
      </div>

      {/* Functional elements - positioned on top */}
      <div 
        className="absolute top-0 left-0 w-full flex h-12 items-center justify-between pl-4 z-30"
        // style={{ backgroundColor: theme === "light" ? "#f9f3f8" : undefined }}
      >
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="text-white h-8 w-8 hover:bg-white/10"
            style={{ backgroundColor: theme === "light" ? "#a84470" : undefined }}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Right side */}
        <div className="flex items-center h-12 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white h-8 w-8 bg-[#140f13] hover:bg-white/10"
            style={{ backgroundColor: theme === "light" ? "#a84470" : undefined }}
          >
            <Share className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="text-white h-8 w-8 bg-[#140f13] hover:bg-white/10"
            style={{ backgroundColor: theme === "light" ? "#a84470" : undefined }}
          >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
