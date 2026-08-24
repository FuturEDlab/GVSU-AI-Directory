import { useState, useRef, useEffect } from "react";
import { askSupportAssistant } from "@/ai/flows/support-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Loader2, RotateCcw } from "lucide-react";
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'model';
  content: string;
};

const SUGGESTED_QUESTIONS = [
  "How do I submit a new tool?",
  "How do I report a mistake?",
  "What is a 'Community Discovery' tool?",
  "How do I change my theme?"
];

export function AISupportTab() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! I am the LakerAI Support Assistant. How can I help you navigate the directory today?' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (question: string) => {
    if (!question.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Keep only last 10 messages for context window
      const history = newMessages.slice(-10);
      const response = await askSupportAssistant(question, history);
      setMessages([...newMessages, { role: 'model', content: response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', content: 'An error occurred while connecting to the support assistant. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', content: 'Hello! I am the LakerAI Support Assistant. How can I help you navigate the directory today?' }]);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gvsuBlue text-white p-2 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50">Virtual Assistant</h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Powered by Gemini</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-slate-400 hover:text-slate-900 dark:hover:text-slate-50">
          <RotateCcw className="w-4 h-4 mr-2" />
          <span className="text-xs font-bold uppercase tracking-widest">Reset</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-3xl mx-auto pb-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-gvsuBlue text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tr-sm' 
                  : 'bg-gvsuBlue/5 border border-gvsuBlue/10 dark:bg-sky-900/20 dark:border-sky-500/20 text-slate-800 dark:text-slate-200 rounded-tl-sm'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gvsuBlue text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gvsuBlue/5 border border-gvsuBlue/10 dark:bg-sky-900/20 dark:border-sky-500/20 rounded-tl-sm flex items-center h-11">
                <Loader2 className="w-4 h-4 animate-spin text-gvsuBlue dark:text-sky-400" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 shrink-0">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-gvsuBlue hover:text-gvsuBlue dark:hover:border-sky-500 dark:hover:text-sky-400 px-3 py-1.5 rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 focus-visible:ring-gvsuBlue rounded-xl"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="h-12 px-6 bg-gvsuBlue hover:bg-midnight text-white font-bold rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
