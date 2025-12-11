// src/components/web3/x402Provider.tsx
import React, { ReactNode } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { AvalancheFuji } from "@thirdweb-dev/chains";

const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!THIRDWEB_CLIENT_ID) {
  console.warn("VITE_THIRDWEB_CLIENT_ID not set — Thirdweb features disabled");
}

interface X402ProviderProps {
  children: ReactNode;
}

export function X402Provider({ children }: X402ProviderProps) {
  return (
    <ThirdwebProvider
      clientId={THIRDWEB_CLIENT_ID || undefined}
      supportedChains={[AvalancheFuji]}
    >
      {children}
    </ThirdwebProvider>
  );
}