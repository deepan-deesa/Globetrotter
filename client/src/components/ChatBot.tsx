import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Mic, MicOff, Loader2, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
    role: "user" | "ai";
    content: string;
    action?: string;
    tripId?: number;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "ai", content: "Hi! I'm TravellerBuddy. Where are we heading next? I can help you plan a full itinerary just by talking to me!" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    // Voice Recognition setup
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
                toast({ title: "Voice captured", description: transcript });
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
                toast({ title: "Voice Error", description: "Could not understand audio.", variant: "destructive" });
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast({ title: "Not Supported", description: "Your browser doesn't support voice recognition.", variant: "destructive" });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsTyping(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!res.ok) throw new Error("AI service unavailable");

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: "ai",
                content: data.message,
                action: data.action,
                tripId: data.tripId
            }]);

            if (data.action === "trip_created") {
                queryClient.invalidateQueries({ queryKey: ["trips"] });
                toast({
                    title: "New Trip Created! 🎒",
                    description: "TravellerBuddy has added a new plan to your dashboard."
                });
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: "ai", content: "Sorry, I'm having a bit of trouble connecting to my travel brain. Please try again!" }]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4"
                    >
                        <Card className="w-[380px] h-[550px] shadow-2xl border-primary/20 backdrop-blur-xl bg-background/95 overflow-hidden flex flex-col">
                            <CardHeader className="bg-primary px-4 py-3 text-primary-foreground flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    TravellerBuddy
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                                            : "bg-muted text-foreground rounded-tl-none border border-primary/10 shadow-sm"
                                            }`}>
                                            {m.content}
                                            {m.tripId && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full mt-2 gap-2 h-7 text-xs"
                                                    onClick={() => {
                                                        setLocation(`/trips/${m.tripId}`);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <MapPin className="w-3 h-3" />
                                                    View Trip
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <CardFooter className="p-3 border-t bg-muted/30">
                                <div className="flex w-full items-center gap-2">
                                    <Button
                                        variant={isListening ? "destructive" : "outline"}
                                        size="icon"
                                        className={`shrink-0 rounded-full h-9 w-9 ${isListening ? "animate-pulse" : ""}`}
                                        onClick={toggleListening}
                                    >
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </Button>
                                    <Input
                                        placeholder="Ask TravelerBuddy..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        className="h-9 border-primary/20 bg-background/50"
                                    />
                                    <Button size="icon" className="shrink-0 h-9 w-9 rounded-full" onClick={handleSend} disabled={isTyping || !input.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 rounded-full shadow-lg gap-2"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </Button>
            </motion.div>
        </div>
    );
}
