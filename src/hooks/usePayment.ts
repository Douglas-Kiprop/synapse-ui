// src/hooks/usePayment.ts - PRODUCTION READY WITH CHAIN SWITCHING
import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type Hash } from "viem";
import { avalancheFuji } from "viem/chains";
import { toast } from "sonner";

export interface PaymentDetails {
  amount: string;
  amount_wei: string;
  recipient: string;
  chain: string;
  description: string;
  tool_name: string;
}

export interface PaymentResult {
  success: boolean;
  txnHash?: Hash;
  error?: string;
}

export interface UsePaymentReturn {
  handlePayment: (details: PaymentDetails) => Promise<PaymentResult>;
  isProcessing: boolean;
  canPay: boolean;
}

// Helper function to check if an error is a chain switch rejection
function isChainSwitchRejected(error: unknown): boolean {
  const err = error as Error;
  return (
    err.message.includes("rejected the request") ||
    err.message.includes("User rejected") ||
    err.message.includes("denied") ||
    err.message.includes("cancel")
  );
}

export function usePayment(): UsePaymentReturn {
  const { wallets, ready } = useWallets();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = useCallback(
    async (details: PaymentDetails): Promise<PaymentResult> => {
      if (!ready) {
        const error = "Wallet not ready. Please wait...";
        toast.error(error);
        return { success: false, error };
      }

      const [activeWallet] = wallets;
      if (!activeWallet) {
        const error = "No wallet connected";
        toast.error("Please connect your wallet first", {
          description: "You need a connected wallet to make payments",
        });
        return { success: false, error };
      }

      if (isProcessing) {
        const error = "Payment already in progress";
        toast.info("Please wait for the current payment to complete");
        return { success: false, error };
      }

      setIsProcessing(true);

      try {
        console.log("💳 Initiating payment:", details);
        
        // --- 1. AUTOMATIC CHAIN SWITCHING LOGIC ---
        toast.loading("Switching wallet to Avalanche Fuji...", { id: "chain-switch" });
        
        try {
          // Use Privy's switchChain method to prompt the wallet to change network
          await activeWallet.switchChain(avalancheFuji.id);
          toast.success("Switched to Avalanche Fuji!", { id: "chain-switch", duration: 1500 });
        } catch (chainSwitchError) {
          toast.dismiss("chain-switch");
          
          if (isChainSwitchRejected(chainSwitchError)) {
            toast.error("Network switch cancelled", {
              description: "Please switch to Avalanche Fuji Testnet manually and try again.",
            });
            return { success: false, error: "User cancelled chain switch" };
          }
          // Re-throw other errors (e.g., chain not added) to be caught by the main catch block
          throw chainSwitchError;
        }
        // --------------------------------------------------

        // Get the Ethereum provider from Privy wallet
        const provider = await activeWallet.getEthereumProvider();

        if (!provider) {
          throw new Error("Failed to get wallet provider");
        }

        // Create viem wallet client
        // We MUST ensure the chain here matches the one we just switched to
        const walletClient = createWalletClient({
          account: activeWallet.address as `0x${string}`,
          chain: avalancheFuji,
          transport: custom(provider),
        });

        // Parse the amount from the payment details
        const amountWei = BigInt(details.amount_wei);

        console.log("💰 Sending transaction:", {
          from: activeWallet.address,
          to: details.recipient,
          value: amountWei.toString(),
          chain: "Avalanche Fuji",
        });

        toast.loading("Confirm payment in your wallet...", {
          id: "wallet-confirmation",
        });

        // Send the transaction - this will trigger the wallet UI on the CORRECT chain
        const txnHash = await walletClient.sendTransaction({
          account: activeWallet.address as `0x${string}`,
          to: details.recipient as `0x${string}`,
          value: amountWei,
          chain: avalancheFuji,
          kzg: undefined, 
        });

        toast.dismiss("wallet-confirmation");

        console.log("✅ Transaction sent:", txnHash);

        toast.success("Payment successful!", {
          description: `${details.description}\nAmount: ${details.amount} AVAX`,
          duration: 5000,
        });

        return { success: true, txnHash };
      } catch (err) {
        toast.dismiss("wallet-confirmation");
        toast.dismiss("chain-switch"); // Ensure all toasts are cleared

        console.error("❌ Payment error:", err);

        const error = err instanceof Error ? err.message : "Payment failed";

        // Check if user rejected the transaction (or chain switch if re-thrown)
        if (
          error.includes("User rejected") ||
          error.includes("denied") ||
          error.includes("rejected the request") ||
          error.includes("cancel")
        ) {
          toast.error("Transaction cancelled", {
            description: "You cancelled the payment transaction",
          });
          return { success: false, error: "User cancelled payment" };
        }

        // Check for insufficient funds
        if (error.includes("insufficient funds") || error.includes("balance")) {
          toast.error("Insufficient funds", {
            description: "You don't have enough AVAX for this transaction",
          });
          return { success: false, error: "Insufficient funds" };
        }
        
        // Handle Chain Switch Error (e.g., wallet doesn't support chain, or generic)
        if (error.includes("wallet_switchEthereumChain") || error.includes("Avalanche Fuji")) {
          toast.error("Chain Switch Failed", {
            description: "The wallet couldn't switch to Avalanche Fuji. You may need to add it manually.",
          });
        }


        // Generic error
        toast.error("Payment failed", {
          description: error.length > 100 ? "Transaction failed. Please try again." : error,
        });

        return { success: false, error };
      } finally {
        setIsProcessing(false);
      }
    },
    [wallets, ready, isProcessing]
  );

  return {
    handlePayment,
    isProcessing,
    canPay: ready && wallets.length > 0 && !isProcessing,
  };
}