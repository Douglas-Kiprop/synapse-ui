import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, CheckCircle, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StrategyBubble } from "./StrategyBubble";
import { useAgentPanel } from "@/contexts/AgentPanelContext";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  strategy?: any; // For strategy transfer from StrategyBuilder
}

interface ChatPanelProps {
  onApplyStrategy?: (strategy: any) => void;
  currentStrategy?: any;
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
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { closeAgent } = useAgentPanel();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setHasStrategyToApply(!!currentStrategy);
  }, [currentStrategy]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      if (!backendUrl) {
        console.error("VITE_BACKEND_URL is not defined in the environment variables.");
        toast({
          title: "Error",
          description: "Backend URL is not configured. Please check your .env files.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response, // Assuming your backend sends a 'response' field
        sender: "agent",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error("Error sending message to backend:", error);
      toast({
        title: "Error",
        description: "Failed to connect to the Synapse Agent. Please ensure your backend is running and accessible.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyStrategy = () => {
    if (onApplyStrategy && currentStrategy) {
      onApplyStrategy(currentStrategy);
      toast({
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
                  "max-w-[80%]",
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
                      "p-3 rounded-lg",
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
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

      {/* Apply Strategy Button */}
      {hasStrategyToApply && (
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
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}