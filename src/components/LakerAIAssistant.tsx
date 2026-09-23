'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react';
import { moderateContent } from '@/lib/content-moderation';
import { discoverTools } from '@/ai/flows/tool-discovery';
import { useFirestore } from '@/firebase/hooks';
import { useAuth } from '@/lib/auth-context';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: any[];
}

interface LakerAIAssistantProps {
  rightElement?: React.ReactNode;
}

export function LakerAIAssistant({ rightElement }: LakerAIAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const firestore = useFirestore();
  const { user } = useAuth();
  
  // Removed client-side tools_published fetch; AI discovery now handles this server-side with caching.

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userText = input.trim();
    setShowResults(true);
    setModerationWarning(null);
    setIsTyping(true);

    // 1. Content Safety Check
    const modResult = moderateContent(userText);
    if (!modResult.isSafe) {
      if (firestore && user) {
        try {
          await addDoc(collection(firestore, 'chatModerationReports'), {
            userId: user.uid,
            userEmail: user.email,
            message: userText,
            violationType: modResult.violationType,
            matchedTerms: modResult.matchedTerms,
            severity: modResult.severity,
            status: 'new',
            createdAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Failed to record moderation event", error);
        }
      }

      setModerationWarning("Sorry, this content isn't appropriate. Continued misuse of LakerAI may result in your account being restricted.");
      setIsTyping(false);
      return;
    }

    // Add user message to history
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);

    // 2. Discover Tools using Genkit flow
    try {
      const historyForAI = updatedMessages.map(m => ({ role: m.role, content: m.content }));

      const aiResponse = await discoverTools(userText, historyForAI);

      if (aiResponse.clarifyingQuestion) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse.clarifyingQuestion!
        }]);
      } else if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I found some strong matches:",
          recommendations: aiResponse.recommendations
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "No strong matches found. I couldn't find a tool above the 50% relevance threshold. Try describing what you want the tool to accomplish."
        }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I couldn't complete the tool search right now. Please try again."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Get only the latest assistant response that has recommendations or a direct answer
  const latestResponse = [...messages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="relative w-full z-50 text-left" ref={containerRef}>
      {/* Input Field Area */}
      <div className="relative flex items-center bg-white rounded-2xl h-14 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-gvsuBlue/20 transition-all overflow-hidden w-full group">
        <div className="px-5 flex items-center text-slate-400 group-focus-within:text-gvsuBlue transition-colors">
          <Sparkles className="w-4 h-4" />
        </div>
        <Input 
          placeholder="Ask LakerAI anything..." 
          className="bg-transparent border-none shadow-none text-base h-full focus-visible:ring-0 px-0 text-slate-900 placeholder:text-slate-400 font-sans"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (messages.length > 0 || isTyping || moderationWarning) {
              setShowResults(true);
            }
          }}
        />
        <Button 
          variant="ghost" 
          className="h-full px-4 rounded-none font-bold text-gvsuBlue uppercase tracking-widest text-xs hover:bg-slate-50"
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
        >
          Ask
        </Button>
        {rightElement}
      </div>

      {/* Inline Results Dropdown */}
      {showResults && (
        <div className="mt-4 w-full bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2">
          
          {/* Header area of results */}
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-row items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Sparkles className="h-4 w-4 text-gvsuBlue" />
                LakerAI Recommendations
              </h3>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200" onClick={() => setShowResults(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="max-h-[400px] w-full" ref={scrollRef}>
            <div className="p-4 flex flex-col space-y-4">
              
              {isTyping && (
                <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <Loader2 className="h-4 w-4 animate-spin text-gvsuBlue" />
                  <span className="text-sm font-medium">Finding the best AI tools...</span>
                </div>
              )}

              {moderationWarning && !isTyping && (
                <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{moderationWarning}</span>
                </div>
              )}

              {!isTyping && !moderationWarning && latestResponse && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {latestResponse.recommendations && latestResponse.recommendations.length > 0 ? (
                    latestResponse.recommendations.map((rec, index) => (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-2 hover:border-gvsuBlue/30 transition-colors h-full">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 truncate text-sm">{rec.toolName}</h4>
                          <span className="text-[10px] font-bold text-gvsuBlue bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            {rec.matchPercentage}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-3 flex-1">
                          {rec.whyThisMatches}
                        </p>
                        <Link href={`/tools/${rec.toolId}`} className="mt-2 w-full">
                          <Button variant="outline" size="sm" className="w-full h-8 text-[10px] font-bold uppercase tracking-wider hover:bg-gvsuBlue hover:text-white transition-colors">
                            View Tool <ExternalLink className="ml-1.5 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {latestResponse.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
