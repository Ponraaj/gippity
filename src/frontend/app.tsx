import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Sidebar } from "@/frontend/components/sidebar";
import { ChatArea } from "@/frontend/components/chat-area";
import { TopBar } from "@/frontend/components/top-bar";
import Login from "@/frontend/components/login";
import { ChatProvider } from "./context/chat-context";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="text-foreground flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <Router>{isAuthenticated ? <AuthenticatedApp /> : <Login />}</Router>;
}

function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = useQuery(api.queries.getCurrentUser);

  if (!user?._id) {
    return (
      <div className="text-foreground flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider userId={user._id}>
      <div className="flex h-screen">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex flex-1 flex-col">
          <TopBar
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex flex-1 overflow-hidden">

            <div className="flex-1 overflow-auto">
              <Routes>
                <Route
                  path="/"
                  element={
                    <ChatArea sidebarOpen={sidebarOpen} userId={user._id} />
                  }
                />
                <Route
                  path="/chat/:threadId"
                  element={
                    <ChatArea sidebarOpen={sidebarOpen} userId={user._id} />
                  }
                />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
