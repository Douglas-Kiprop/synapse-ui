import { useEffect, useState } from "react";
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
import MarketDataPage from "./pages/market-data/MarketDataPage";
import GainersLosersPage from "./pages/market-data/GainersLosersPage";
import HeatmapPage from "./pages/market-data/HeatmapPage";
import NotFound from "./pages/NotFound";
import StrategiesPage from "./pages/StrategiesPage";
import SignalsPage from "./pages/SignalsPage";
import SettingsPage from "./pages/SettingsPage";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthFetch } from "./hooks/useAuthFetch";
import { useToast } from "./components/ui/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const { authenticated, getAccessToken } = usePrivy();
  const { fetchWithAuth } = useAuthFetch();
  const { toast } = useToast();
  const [backendAuthenticated, setBackendAuthenticated] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    const verifyBackendAuth = async () => {
      if (!authenticated) return;

      setAuthAttempted(true);

      try {
        const privyToken = await getAccessToken();
        if (!privyToken || typeof privyToken !== 'string' || privyToken.trim() === '') {
          console.error("Privy access token is invalid or missing.");
          setBackendAuthenticated(false);
          return; // Exit early if token is not valid
        }

        const response = await fetchWithAuth(
          `${import.meta.env.VITE_SYNAPSE_API_URL}/auth/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: privyToken }),
          }
        );

        if (response.ok) {
          setBackendAuthenticated(true);
          toast({
            title: "Backend Connected",
            description: "Successfully authenticated with backend.",
          });
        } else {
          setBackendAuthenticated(false);
          console.error("Backend authentication failed:", response.statusText);
        }
      } catch (error) {
        setBackendAuthenticated(false);
        console.error("Could not connect to backend:", error);
      }
    };

    if (authenticated && !backendAuthenticated && !authAttempted) {
      verifyBackendAuth();
    }

    if (!authenticated && authAttempted) {
      setAuthAttempted(false);
    }

  }, [authenticated, fetchWithAuth, toast, backendAuthenticated, getAccessToken, authAttempted]);

  return (
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
            <Route path="/analytics" element={
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            } />
            <Route path="/portfolio" element={
              <MainLayout>
                <PortfolioPage />
              </MainLayout>
            } />            
            <Route path="/market-data" element={
              <MainLayout>
                <MarketDataPage />
              </MainLayout>
            } />
            <Route path="/market-data/gainers-losers" element={
              <MainLayout>
                <GainersLosersPage />
              </MainLayout>
            } />
            <Route path="/signals" element={
              <MainLayout>
                <SignalsPage />
              </MainLayout>
            } />
            <Route path="/tools/*" element={
              <MainLayout>
                <NotFound />
              </MainLayout>
            } />
            <Route path="/settings" element={
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            } />
            <Route path="/strategies" element={
              <MainLayout>
                <StrategiesPage />
              </MainLayout>
            } />
            <Route path="/market-data/heatmap" element={
              <MainLayout>
                <HeatmapPage />
              </MainLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;