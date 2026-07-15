"use client";

import { useState, useEffect, useRef } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { Message } from "@/app/lib/tool-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketThreadProps {
  toolId: string;
  ticketId: string;
  onClose?: () => void;
}

export function TicketThread({ toolId, ticketId, onClose }: TicketThreadProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "tools_submitted", toolId, "tickets", ticketId, "messages"),
      orderBy("createdAt", "asc")
    );
  }, [firestore, toolId, ticketId]);

  const { data: messages, isLoading } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !firestore) return;

    const content = newMessage;
    setNewMessage("");

    await addDoc(collection(firestore, "tools_submitted", toolId, "tickets", ticketId, "messages"), {
      senderId: user.uid,
      senderName: user.displayName || "GVSU User",
      content,
      isAdmin: user.email === "indrajis@mail.gvsu.edu",
      createdAt: serverTimestamp()
    });
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-white overflow-hidden shadow-2xl">
      <div className="bg-gvsuBlue p-4 text-white flex justify-between items-center shrink-0">
        <div>
          <h3 className="font-bold text-sm tracking-wider uppercase">Governance Ticket</h3>
          <p className="text-[9px] opacity-70 font-mono">{ticketId}</p>
        </div>
        {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:text-white/80">CLOSE</Button>}
      </div>

      <ScrollArea className="flex-1 p-4 bg-slate-50">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gvsuBlue" /></div>
          ) : (messages || []).map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[85%] space-y-1",
                msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                {msg.isAdmin ? <Shield className="w-3 h-3 text-gvsuBlue" /> : <User className="w-3 h-3" />}
                {msg.senderName}
              </div>
              <div className={cn(
                "px-4 py-2 rounded-2xl text-sm shadow-sm",
                msg.senderId === user?.uid 
                  ? "bg-gvsuBlue text-white rounded-tr-none" 
                  : "bg-white border rounded-tl-none"
              )}>
                {msg.content}
              </div>
              <div className="text-[8px] text-slate-300">
                {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2 shrink-0">
        <Input 
          placeholder="Type message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="rounded-full bg-slate-50"
        />
        <Button type="submit" size="icon" className="rounded-full bg-gvsuBlue shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
