import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

export function AuthButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) return null;

  // Safely derive a displayable address string
  const rawAddr =
    typeof user?.wallet?.address === "string"
      ? user.wallet.address
      : (user?.wallet?.address as any)?.address;

  const address =
    typeof rawAddr === "string" ? rawAddr : undefined;

  const label = authenticated
    ? (address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : typeof user?.email === "string"
          ? user.email
          : "Signed in")
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