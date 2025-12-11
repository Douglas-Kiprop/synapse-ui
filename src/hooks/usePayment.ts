// src/hooks/usePayment.ts
import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type Chain } from "viem";
import { parseEther } from "viem";
import { toast } from "sonner";

// Types
export interface PaymentResult {
  success: boolean;
  txnHash?: `0x${string}`;
  error?: string;
}

export interface UsePaymentOptions {
  treasuryAddress: string;
  feeAmount?: number;
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  description?: string;
}

// Fuji chain
const FUJI_CHAIN: Chain = {
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Snowtrace", url: "https://testnet.snowtrace.io" },
  },
  testnet: true,
} as const;

const DEFAULT_FEE = 0.0005;

export function usePayment(options: UsePaymentOptions) {
  const {
    treasuryAddress,
    feeAmount = DEFAULT_FEE,
    onSuccess,
    onError,
    description = "Premium Tool Access",
  } = options;

  const { wallets, ready } = useWallets();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = useCallback(async (): Promise<PaymentResult> => {
    if (!ready) {
      const error = "Authentication not ready";
      onError?.(error);
      toast.error(error);
      return { success: false, error };
    }

    const [activeWallet] = wallets;
    if (!activeWallet) {
      const error = "No active wallet connected";
      onError?.(error);
      toast.error("Connect a wallet to proceed with payment");
      return { success: false, error };
    }

    if (isProcessing) {
      toast.info("Payment already in progress");
      return { success: false, error: "Already processing" };
    }

    setIsProcessing(true);

    try {
      const amountWei = parseEther(feeAmount.toString());
      const provider = await activeWallet.getEthereumProvider();

      // Create a viem wallet client from the Privy wallet
      const walletClient = createWalletClient({
        account: activeWallet.address as `0x${string}`,
        chain: FUJI_CHAIN,
        transport: custom(provider),
      });

      // IMPORTANT: viem v2 requires kzg: undefined even for non-blob txs
      const txnHash = await walletClient.sendTransaction({
        account: activeWallet.address as `0x${string}`,
        chain: FUJI_CHAIN,
        to: treasuryAddress as `0x${string}`,
        value: amountWei,
        kzg: undefined,        // <-- FIXED
      });

      const result: PaymentResult = { success: true, txnHash };
      onSuccess?.(result);

      toast.success(
        `Payment successful for ${description}! Tx: ${txnHash.slice(0, 10)}...`,
        { description: `Fee: ${feeAmount} AVAX` }
      );

      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Payment transaction failed";

      onError?.(error);
      toast.error(`Payment failed: ${error}`, {
        description: "Check wallet balance and network",
      });

      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  }, [
    wallets,
    ready,
    treasuryAddress,
    feeAmount,
    description,
    onSuccess,
    onError,
    isProcessing,
  ]);

  return {
    handlePayment,
    isProcessing,
    canPay: ready && wallets.length > 0 && !isProcessing,
  };
}
