import { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuthFetch } from "@/hooks/useAuthFetch";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { fetchWithAuth } = useAuthFetch();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground/70">Loading authentication…</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card border border-border/50 p-6 rounded-lg shadow-card text-center">
          <p className="mb-4 text-foreground">Please sign in to continue</p>
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}