// src/components/ChatPanel.tsx - PRODUCTION READY
import { useState, useRef, useEffect } from "react";
import { Send, User, CheckCircle, Brain, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { StrategyBubble } from "./StrategyBubble";
import { useAgentPanel } from "@/contexts/AgentPanelContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { usePayment } from "@/hooks/usePayment";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  strategy?: any;
}

interface ChatPanelProps {
  onApplyStrategy?: (strategy: any) => void;
  currentStrategy?: any;
}

interface PaymentDetails {
  amount: string;
  amount_wei: string;
  recipient: string;
  chain: string;
  description: string;
  tool_name: string;
}

interface PendingPayment {
  originalMessage: string;
  paymentDetails: PaymentDetails;
}

export function ChatPanel({ onApplyStrategy, currentStrategy }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Welcome to Synapse! I'm your crypto analytics agent with access to 20 powerful tools. How can I help you craft or refine your investment strategy today?",
      sender: "agent",
      timestamp: new Date(),
    },
    {
      id: "4",
      content: "strategy",
      sender: "agent",
      timestamp: new Date(Date.now() - 1000 * 30),
      strategy: {
        name: "DeFi Yield Farming Strategy",
        type: "Yield Farming",
        allocation: "$25,000",
        timeframe: "3-6 months",
        expectedReturn: "15-25% APY",
        riskLevel: "Medium" as const,
        description: "A balanced approach to yield farming across multiple DeFi protocols with automated rebalancing and risk management."
      }
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStrategyToApply, setHasStrategyToApply] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast: shadcnToast } = useToast();
  const { closeAgent } = useAgentPanel();
  const { fetchWithAuth } = useAuthFetch();
  const { handlePayment, isProcessing: paymentProcessing } = usePayment();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setHasStrategyToApply(!!currentStrategy);
  }, [currentStrategy]);

  const handleSendMessage = async (retryWithHash?: string) => {
    const messageToSend = retryWithHash ? pendingPayment?.originalMessage : inputValue;
    
    if (!messageToSend?.trim()) return;

    // Only add user message if it's a new message (not a retry)
    if (!retryWithHash) {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue("");
    }
    
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      if (!backendUrl) {
        console.error("VITE_BACKEND_URL is not defined in the environment variables.");
        shadcnToast({
          title: "Error",
          description: "Backend URL is not configured. Please check your .env files.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetchWithAuth(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          txn_hash: retryWithHash || null
        }),
      });

      // ✅ Handle x402 Payment Required
      if (response.status === 402) {
        const paymentData = await response.json();
        console.log("💳 Payment required:", paymentData);

        // ✅ FIXED: Correct path to payment details
        const paymentDetails: PaymentDetails = paymentData.payment;

        if (!paymentDetails) {
          throw new Error("Invalid payment response from server");
        }

        // Store the original message and payment details
        setPendingPayment({
          originalMessage: messageToSend,
          paymentDetails: paymentDetails
        });

        // Show payment prompt to user
        const agentMessage: Message = {
          id: Date.now().toString(),
          content: `🔒 **Premium Tool Access Required**\n\nTo use **${paymentDetails.tool_name}**, you need to pay **${paymentDetails.amount} AVAX**.\n\n**Recipient:** \`${paymentDetails.recipient}\`\n\n**Description:** ${paymentDetails.description}\n\nClick the "Pay Now" button below to proceed with payment.`,
          sender: "agent",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, agentMessage]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentResponse]);
      
      // Clear pending payment after successful response
      setPendingPayment(null);

    } catch (error) {
      console.error("Error sending message to backend:", error);
      shadcnToast({
        title: "Error",
        description: "Failed to connect to the Synapse Agent. Please ensure your backend is running and accessible.",
        variant: "destructive",
      });
    } finally {
      if (!paymentProcessing) {
        setIsLoading(false);
      }
    }
  };

  const handlePayNow = async () => {
    if (!pendingPayment) return;

    try {
      sonnerToast.loading("Preparing payment...", { id: "payment-flow" });

      // Trigger payment via usePayment hook
      const result = await handlePayment(pendingPayment.paymentDetails);

      if (!result.success || !result.txnHash) {
        sonnerToast.dismiss("payment-flow");
        if (!result.error?.includes("cancel") && !result.error?.includes("reject")) {
          shadcnToast({
            title: "Payment Failed",
            description: result.error || "Unknown error occurred",
            variant: "destructive",
          });
        }
        setPendingPayment(null);
        return;
      }

      sonnerToast.dismiss("payment-flow");

      const paymentConfirmation: Message = {
        id: Date.now().toString(),
        content: `✅ Payment successful!\n\nTransaction: \`${result.txnHash}\`\n\nVerifying payment and executing tool...`,
        sender: "agent",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, paymentConfirmation]);

      // ✅ Retry original request with transaction hash
      sonnerToast.loading("Executing premium tool...", { id: "tool-execution" });
      await handleSendMessage(result.txnHash);
      sonnerToast.dismiss("tool-execution");

    } catch (error) {
      console.error("Payment error:", error);
      sonnerToast.dismiss("payment-flow");
      sonnerToast.dismiss("tool-execution");
      
      shadcnToast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      setPendingPayment(null);
      setIsLoading(false);
    }
  };

  const handleCancelPayment = () => {
    setPendingPayment(null);
    shadcnToast({
      title: "Payment Cancelled",
      description: "You can try again anytime.",
    });
  };

  const handleApplyStrategy = () => {
    if (onApplyStrategy && currentStrategy) {
      onApplyStrategy(currentStrategy);
      shadcnToast({
        title: "Strategy Applied",
        description: "Your strategy has been updated in the Strategy Builder.",
      });
      setHasStrategyToApply(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-card border-border/50 shadow-card">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Synapse Agent</h3>
            </div>
          </div>
          <button
            aria-label="Collapse Synapse Agent"
            onClick={closeAgent}
            className="inline-flex items-center justify-center rounded-md border border-border/50 text-foreground hover:bg-secondary px-2 py-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "agent" && (
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] break-all whitespace-pre-wrap w-fit",
                  message.sender === "user" ? "ml-auto" : ""
                )}
              >
                {message.content === "strategy" && message.strategy ? (
                  <StrategyBubble 
                    strategy={message.strategy} 
                    onApply={onApplyStrategy || (() => {})}
                  />
                ) : (
                  <div
                    className={cn(
                      "p-3 rounded-lg prose prose-invert text-sm max-w-none",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[gfm]}>
                      {message.content}
                    </ReactMarkdown>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  <span className="text-sm ml-2">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Payment Button */}
      {pendingPayment && !isLoading && (
        <div className="p-3 border-t border-border/50 bg-secondary/20 space-y-2">
          <Button 
            onClick={handlePayNow}
            disabled={paymentProcessing}
            className="w-full bg-crypto-green hover:bg-crypto-green/90 text-white"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            {paymentProcessing ? "Processing..." : `Pay ${pendingPayment.paymentDetails.amount} AVAX Now`}
          </Button>
          <button
            onClick={handleCancelPayment}
            disabled={paymentProcessing}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Apply Strategy Button */}
      {hasStrategyToApply && !pendingPayment && (
        <div className="p-3 border-t border-border/50 bg-secondary/20">
          <Button 
            onClick={handleApplyStrategy}
            className="w-full bg-crypto-green hover:bg-crypto-green/90 text-white"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Apply Strategy to Builder
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about strategies, market analysis, or any crypto insights..."
            className="flex-1 bg-background/50 border-border/50 focus:border-primary"
            disabled={isLoading || paymentProcessing}
          />
          <Button 
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading || paymentProcessing}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}