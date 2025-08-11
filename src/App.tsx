import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import StrategyBuilderPage from "./pages/StrategyBuilderPage";
import PortfolioPage from "./pages/PortfolioPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          } />
          <Route path="/strategy-builder" element={
            <MainLayout>
              <StrategyBuilderPage />
            </MainLayout>
          } />
          <Route path="/portfolio" element={
            <MainLayout>
              <PortfolioPage />
            </MainLayout>
          } />
          <Route path="/analytics" element={
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          } />
          <Route path="/market-data" element={
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          } />
          <Route path="/signals" element={
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          } />
          <Route path="/tools/*" element={
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
