import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Sidebar } from "@/frontend/components/sidebar";
import { ChatArea } from "@/frontend/components/chat-area";
import { TopBar } from "@/frontend/components/top-bar";
import Login from "@/frontend/components/login";
import { useState } from "react";
import { ChatProvider } from "./contexts/chat-context";

export default function App() {
  return (
    <Router>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center text-gray-500">
          Loading...
        </div>
      </AuthLoading>
      <Unauthenticated>
        <Login />
      </Unauthenticated>

      <Authenticated>
        <MainPage />
      </Authenticated>
    </Router>
  );
}

function MainPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <ChatProvider>
      <div className="bg-background flex h-screen flex-col">
        <TopBar
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route
                path="/"
                element={<ChatArea sidebarOpen={sidebarOpen} />}
              />
              {/* Add more routes here */}
            </Routes>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
