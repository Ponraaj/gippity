import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/frontend/components/ui/ThemeProvider";
import { ConvexClientProvider } from "@/frontend/components/ConvexClientProvider";

const fontSans = Geist({
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gippity",
  description: "An Open-source AI Chat Application",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          fontSans.className,
        )}
      >
        <ConvexClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
