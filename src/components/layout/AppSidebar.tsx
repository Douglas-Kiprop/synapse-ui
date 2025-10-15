import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Brain,
  DollarSign,
  Home,
  Settings,
  TrendingUp,
  Zap,
  Activity,
  PieChart,
  Target,
  Bot
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAgentPanel } from "@/contexts/AgentPanelContext";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Strategy Builder", url: "/strategy-builder", icon: Brain },
  { title: "Strategies", url: "/strategies", icon: Target },
  { title: "Portfolio", url: "/portfolio", icon: PieChart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Market Data", url: "/market-data", icon: TrendingUp },
  { title: "Signals", url: "/signals", icon: Zap },
];

const toolsItems = [
  { title: "Risk Analysis", url: "/tools/risk", icon: Target },
  { title: "Performance", url: "/tools/performance", icon: Activity },
  { title: "DeFi Tracker", url: "/tools/defi", icon: DollarSign },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { openAgent } = useAgentPanel();

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((i) => isActive(i.url)) || 
                     toolsItems.some((i) => isActive(i.url));

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "transition-all duration-200 group",
      isActive 
        ? "bg-gradient-primary text-primary-foreground shadow-glow border border-primary/20" 
        : "hover:bg-secondary text-foreground border border-transparent hover:text-foreground"
    );

  return (
    <Sidebar
      className={cn(
        "border-r border-border/50 bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* Logo/Brand */}
        <div className="mb-6 px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Synapse
                </h1>
                <p className="text-xs text-muted-foreground">Crypto Analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-xs uppercase tracking-wider text-foreground/70 mb-2 font-medium",
            collapsed && "sr-only"
          )}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClassName}
                    >
                      <item.icon className={cn(
                        "transition-all duration-200",
                        collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
                      )} />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className={cn(
            "text-xs uppercase tracking-wider text-foreground/70 mb-2 font-medium",
            collapsed && "sr-only"
          )}>
            Analytics Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Synapse Agent opener */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => openAgent()}
                  className={cn(
                    "transition-all duration-200 group hover:bg-secondary text-foreground border border-transparent hover:text-foreground"
                  )}
                >
                  <Bot className={cn(
                    "transition-all duration-200",
                    collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
                  )} />
                  {!collapsed && (
                    <span className="font-medium">Synapse Agent</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClassName}
                    >
                      <item.icon className={cn(
                        "transition-all duration-200",
                        collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
                      )} />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings at bottom */}
        <div className="mt-auto pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/settings" 
                  className={getNavClassName}
                >
                  <Settings className={cn(
                    "transition-all duration-200",
                    collapsed ? "w-5 h-5" : "w-4 h-4 mr-3"
                  )} />
                  {!collapsed && (
                    <span className="font-medium">Settings</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}