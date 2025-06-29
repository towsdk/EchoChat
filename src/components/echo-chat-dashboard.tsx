"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FC, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getFilterDecision } from "@/app/actions";
import type { Message, ActivityLog } from "@/types";
import {
  Zap,
  ZapOff,
  Bot,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const sampleMessages: Omit<Message, "id" | "timestamp">[] = [
    { sender: 'Alice', text: 'Project Phoenix update: We are on track for the Q3 deadline. All modules are passing tests.' },
    { sender: 'Bob', text: 'I found a great new coffee shop downtown! Who wants to go?' },
    { sender: 'Charlie', text: 'Weekly report is ready. Key metric for Project Phoenix is up by 5%.' },
    { sender: 'Diana', text: 'Anyone have a charger I can borrow?' },
    { sender: 'Ethan', text: 'Critical bug found in the authentication service. All hands on deck for Project Phoenix.' },
    { sender: 'Fiona', text: 'Happy birthday, Bob!' },
    { sender: 'George', text: 'The new designs for Project Phoenix are approved. I will share them shortly.' },
    { sender: 'Hannah', text: 'Let\'s schedule the Project Phoenix review for next Monday.' },
    { sender: 'Ian', text: 'My cat learned a new trick!' },
    { sender: 'Julia', text: 'Reminder: Project Phoenix code freeze is this Friday EOD.' },
];

interface ConnectionCardProps {
  title: string;
  connected: boolean;
  connecting: boolean;
  onToggle: () => void;
  children: ReactNode;
}

const ConnectionCard: FC<ConnectionCardProps> = ({ title, connected, connecting, onToggle, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-3 w-3 rounded-full transition-colors",
              connected ? "bg-green-500" : "bg-muted-foreground",
              connecting && "animate-pulse"
            )}
          />
          {title}
        </div>
        <Button size="sm" onClick={onToggle} disabled={connecting}>
          {connecting ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> ) : connected ? ( <><ZapOff className="mr-2 h-4 w-4" /> Disconnect</> ) : ( <><Zap className="mr-2 h-4 w-4" /> Connect</> )}
        </Button>
      </CardTitle>
      <CardDescription>{children}</CardDescription>
    </CardHeader>
  </Card>
);

const MessageItem: FC<{ message: Message }> = ({ message }) => (
    <div className="flex flex-col space-y-1 rounded-lg p-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary">{message.sender}</p>
            <p className="text-xs text-muted-foreground">{message.timestamp}</p>
        </div>
        <p className="text-sm text-foreground/90">{message.text}</p>
    </div>
);

export function EchoChatDashboard() {
  const [sourceConnected, setSourceConnected] = useState(false);
  const [destConnected, setDestConnected] = useState(false);
  const [isConnectingSource, setIsConnectingSource] = useState(false);
  const [isConnectingDest, setIsConnectingDest] = useState(false);
  const [topic, setTopic] = useState("Project Phoenix Status Updates");
  const topicInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [sourceMessages, setSourceMessages] = useState<Message[]>([]);
  const [forwardedMessages, setForwardedMessages] = useState<Message[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const messageCounter = useRef(0);

  const handleToggleSource = () => {
    setIsConnectingSource(true);
    setTimeout(() => {
        setSourceConnected(prev => !prev);
        setIsConnectingSource(false);
    }, 1500);
  };
  const handleToggleDest = () => {
    setIsConnectingDest(true);
    setTimeout(() => {
        setDestConnected(prev => !prev);
        setIsConnectingDest(false);
    }, 1500);
  };
  
  const handleSendNewMessage = () => {
    if (newMessageText.trim() === "") return;

    const timestamp = format(new Date(), "p");
    const newMessage: Message = {
      id: new Date().toISOString() + Math.random(),
      sender: "Towhid",
      text: newMessageText.trim(),
      timestamp,
    };

    setSourceMessages(prev => [newMessage, ...prev]);
    setForwardedMessages(prev => [newMessage, ...prev]); // Also add to forwarded messages
    setNewMessageText(""); // Clear the input
  };



  const handleSetTopic = () => {
    const newTopic = topicInputRef.current?.value;
    if (newTopic && newTopic.trim() !== "") {
      setTopic(newTopic.trim());
      toast({
        title: "AI Filter Updated",
        description: `Now filtering for messages about: "${newTopic.trim()}"`,
      });
    }
  };

  const handleNewMessage = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const rawMessage = sampleMessages[messageCounter.current % sampleMessages.length];
    messageCounter.current += 1;
    const timestamp = format(new Date(), "p");
    const newMessage: Message = { ...rawMessage, id: new Date().toISOString() + Math.random(), timestamp };
    
    setSourceMessages(prev => [newMessage, ...prev]);

    const result = await getFilterDecision({ message: newMessage.text, topic });
    
    const logEntry: ActivityLog = {
        id: newMessage.id,
        messageText: newMessage.text,
        sender: newMessage.sender,
        decision: 'Blocked',
        reason: 'N/A',
        timestamp: format(new Date(), "p"),
    };

    if (result.success && result.data) {
        logEntry.reason = result.data.reason;
        if(result.data.isRelevant) {
            logEntry.decision = 'Forwarded';
            setForwardedMessages(prev => [newMessage, ...prev]);
        } else {
            logEntry.decision = 'Blocked';
        }
    } else {
        logEntry.decision = 'Blocked';
        logEntry.reason = result.error || 'AI filter failed to respond.';
        toast({ variant: 'destructive', title: 'AI Error', description: logEntry.reason });
    }

    setActivityLog(prev => [logEntry, ...prev]);
    setIsProcessing(false);
  }, [isProcessing, topic, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sourceConnected && destConnected) {
      interval = setInterval(handleNewMessage, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sourceConnected, destConnected, handleNewMessage]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-1">
        <ConnectionCard title="Source Group" connected={sourceConnected} connecting={isConnectingSource} onToggle={handleToggleSource}>
          Simulated connection to the primary WhatsApp group.
        </ConnectionCard>
        <ConnectionCard title="Destination Group" connected={destConnected} connecting={isConnectingDest} onToggle={handleToggleDest}>
          Connect to the group where relevant messages will be forwarded.
        </ConnectionCard>
        {/* this section for user typing message option */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare /> Send Message to Source</CardTitle>
            <CardDescription>Add a message directly to the Source Feed.</CardDescription>
          </CardHeader>
          <CardContent className="flex w-full items-center space-x-2">
              <Input type="text" placeholder="Type your message here..." value={newMessageText} onChange={(e) => setNewMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendNewMessage()} />
              <Button onClick={handleSendNewMessage}><Send /></Button>

          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot /> AI Filter Configuration</CardTitle>
            <CardDescription>
              Define the topic for the AI to filter relevant messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex w-full items-center space-x-2">
              <Input
                ref={topicInputRef}
                type="text"
                defaultValue={topic}
                placeholder="e.g., Project Phoenix Updates"
                onKeyDown={(e) => e.key === 'Enter' && handleSetTopic()}
              />
              <Button onClick={handleSetTopic}>Set</Button>
            </div>
          </CardContent>
        </Card>

      </div>
      <div className="space-y-6 xl:col-span-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare /> Source Feed</CardTitle>
                <CardDescription>Real-time messages from the source group.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-80">
                  {sourceMessages.length === 0 ? <p className="text-center text-sm text-muted-foreground pt-16">Connect groups to see messages</p> : sourceMessages.map(msg => <MessageItem key={msg.id} message={msg} />)}
                </ScrollArea>
              </CardContent>
            </Card>
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send /> Forwarded Messages</CardTitle>
                <CardDescription>Messages forwarded by the AI filter.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-80">
                   {forwardedMessages.length === 0 ? <p className="text-center text-sm text-muted-foreground pt-16">No messages forwarded yet</p> : forwardedMessages.map(msg => <MessageItem key={msg.id} message={msg} />)}
                </ScrollArea>
              </CardContent>
            </Card>
        </div>
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>AI Decision Log</CardTitle>
                <CardDescription>Activity log of the message filtering process.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4">
                        {activityLog.length === 0 ? <p className="text-center text-sm text-muted-foreground pt-16">No activity to show</p> : activityLog.map(log => (
                            <div key={log.id} className="flex items-start gap-4">
                                <div>
                                    {log.decision === 'Forwarded' ? <CheckCircle2 className="h-5 w-5 text-accent"/> : <XCircle className="h-5 w-5 text-destructive"/>}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">
                                            Message from <span className="text-primary">{log.sender}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">"{log.messageText}"</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <Badge variant={log.decision === 'Forwarded' ? 'default' : 'destructive'} className={cn(log.decision === 'Forwarded' && 'bg-accent text-accent-foreground')}>{log.decision}</Badge>
                                        <p className="text-muted-foreground">Reason: {log.reason}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
