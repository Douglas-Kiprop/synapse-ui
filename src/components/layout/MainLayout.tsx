import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { AgentPanelProvider, useAgentPanel } from "@/contexts/AgentPanelContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

function LayoutBody({ children }: MainLayoutProps) {
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const { agentOpen } = useAgentPanel();

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
        <div className={cn("flex-1 flex flex-col", agentOpen ? "lg:mr-96" : "lg:mr-0")}>
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
        <div
          className={cn(
            agentOpen ? "fixed right-0 top-0 h-full w-96 border-l border-border/50 bg-background z-20 hidden lg:block"
                      : "hidden"
          )}
        >
          <ChatPanel 
            onApplyStrategy={handleApplyStrategy}
            currentStrategy={currentStrategy}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AgentPanelProvider>
      <LayoutBody>{children}</LayoutBody>
    </AgentPanelProvider>
  );
}