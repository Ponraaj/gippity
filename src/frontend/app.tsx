import { useState } from 'react';
import { Sidebar } from "../frontend/components/sidebar";
import { ChatArea } from "../frontend/components/chat-area";
import { TopBar } from '../frontend/components/top-bar';
import { ChatProvider } from '../frontend/contexts/chat-context';


export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ChatProvider>
      <div className="flex flex-col h-screen bg-background">
        <TopBar 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          <ChatArea sidebarOpen={sidebarOpen} />
        </div>
      </div>
    </ChatProvider>
  );
}