import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) return null;

  const label = authenticated
    ? (user?.wallet?.address
        ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
        : user?.email ?? "Signed in")
    : "Sign in";

  return authenticated ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Button variant="outline" size="sm" onClick={logout}>
        Sign out
      </Button>
    </div>
  ) : (
    <Button
      size="sm"
      className="bg-gradient-primary hover:shadow-glow transition-all"
      onClick={() => login()}
    >
      {label}
    </Button>
  );
}