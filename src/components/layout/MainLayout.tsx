import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [currentStrategy, setCurrentStrategy] = useState(null);

  const handleStrategyChange = (strategy: any) => {
    setCurrentStrategy(strategy);
  };

  const handleApplyStrategy = (strategy: any) => {
    // This would update the strategy in the StrategyBuilder
    console.log("Applying strategy:", strategy);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:mr-96">
          {/* Header */}
          <header className="h-14 border-b border-border/50 bg-gradient-card flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger className="mr-4">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex-1" />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-hidden">
            {children}
          </main>
        </div>

        {/* Chat Panel - Fixed Right Side */}
        <div className="fixed right-0 top-0 h-full w-96 border-l border-border/50 bg-background z-20 hidden lg:block">
          <ChatPanel 
            onApplyStrategy={handleApplyStrategy}
            currentStrategy={currentStrategy}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}