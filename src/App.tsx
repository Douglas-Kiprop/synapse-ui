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
import NotFound from "./pages/NotFound";
import StrategiesPage from "./pages/StrategiesPage";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthFetch } from "./hooks/useAuthFetch";
import { useToast } from "./components/ui/use-toast";

const queryClient = new QueryClient();
const MAX_RETRIES = 3;
const RETRY_COOLDOWN_MS = 5000;

const App = () => {
  const { authenticated, getAccessToken } = usePrivy();
  const { fetchWithAuth } = useAuthFetch();
  const { toast } = useToast();
  const [backendAuthenticated, setBackendAuthenticated] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  useEffect(() => {
    const verifyBackendAuth = async () => {
      if (!authenticated || backendUnreachable) return;

      try {
        const privyToken = await getAccessToken();
        if (!privyToken || typeof privyToken !== 'string' || privyToken.trim() === '') {
          console.error("Privy access token is invalid or missing.");
          handleRetry("Privy access token is invalid or missing.");
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
          setRetryCount(0);
          setBackendUnreachable(false);
          toast({
            title: "Backend Connected",
            description: "Successfully authenticated with backend.",
          });
        } else {
          handleRetry("Backend returned an error");
        }
      } catch (error) {
        handleRetry("Could not connect to backend");
      }
    };

    const handleRetry = (errorMsg: string) => {
      if (retryCount < MAX_RETRIES) {
        setCooldown(true);
        toast({
          title: "Retrying...",
          description: `${errorMsg} (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
          variant: "default",
        });

        // Reset cooldown after delay
        setTimeout(() => {
          setCooldown(false);
          setRetryCount(prev => prev + 1);
        }, RETRY_COOLDOWN_MS);
      } else {
        setBackendUnreachable(true);
        setBackendAuthenticated(false);
        toast({
          title: "Backend Unreachable",
          description: "Could not connect to backend after multiple attempts. Please check if the backend is running.",
          variant: "destructive",
          duration: 10000,
        });
      }
    };

    if (!cooldown && authenticated && !backendAuthenticated) {
      verifyBackendAuth();
    }
  }, [authenticated, fetchWithAuth, toast, retryCount, cooldown, backendUnreachable, backendAuthenticated, getAccessToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <MainLayout>
                {backendUnreachable ? (
                  <div className="flex items-center justify-center min-h-screen flex-col gap-4">
                    <h1 className="text-2xl font-bold">Backend Unreachable</h1>
                    <p className="text-gray-600">Please check if the backend server is running and try again.</p>
                    <button
                      onClick={() => {
                        setBackendUnreachable(false);
                        setRetryCount(0);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : !backendAuthenticated && authenticated ? (
                  <div className="flex items-center justify-center min-h-screen flex-col gap-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">
                      {cooldown
                        ? `Retrying in ${RETRY_COOLDOWN_MS / 1000}s...`
                        : "Connecting to backend..."}
                    </p>
                  </div>
                ) : (
                  <DashboardPage />
                )}
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
            <Route path="/strategies" element={
              <MainLayout>
                <StrategiesPage />
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