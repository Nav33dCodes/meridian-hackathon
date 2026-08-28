'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/useAppStore';
import { agentApi } from '@/lib/api/analysis';
import { Bot, Send, Trash2, Loader2, User } from 'lucide-react';

const SUGGESTED = [
  'What is the current heat risk in Phoenix?',
  'Which zones are most at risk today?',
  'Recommend cooling strategies for Dubai Marina',
  'Correlate temperature spikes with humidity levels',
  'Generate a heat advisory for Karachi',
];

export default function AgentPage() {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const { agentMessages, addAgentMessage, clearAgentMessages } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [streamingText, setStreamingText] = useState('');

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth' });
    }
  }, [agentMessages, streamingText, streaming, isAtBottom]);

  const send = async (query: string) => {
    if (!query.trim() || streaming) return;
    setInput('');
    setIsAtBottom(true); // Force scroll to bottom on send

    addAgentMessage({ id: crypto.randomUUID(), role: 'user', content: query, timestamp: new Date() });
    setStreaming(true);
    setStreamingText('');

    try {
      const res = await fetch(agentApi.streamUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, stream: true }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const chunk = JSON.parse(data);
            full += chunk.text || chunk;
            setStreamingText(full);
          } catch { /* skip */ }
        }
      }

      addAgentMessage({ id: crypto.randomUUID(), role: 'assistant', content: full, timestamp: new Date() });
    } catch (err) {
      addAgentMessage({
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Connection error. Make sure the API is running on http://localhost:5250',
        timestamp: new Date()
      });
    } finally {
      setStreaming(false);
      setStreamingText('');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[900px] mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Meridian AI Agent</h1>
          <p className="text-sm text-secondary mt-1">
            Powered by Groq · Ask anything about urban heat
          </p>
        </div>
        {agentMessages.length > 0 && (
          <button 
            onClick={clearAgentMessages} 
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-risk-high/10 border border-risk-high/20 text-risk-high text-sm hover:bg-risk-high/20 transition-colors"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-2"
      >
        {agentMessages.length === 0 && !streaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center -mt-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center shadow-token-sm">
              <Bot size={28} color="var(--bg-base)" />
            </div>
            <p className="font-semibold text-primary mb-2">Meridian Agent Ready</p>
            <p className="text-sm text-tertiary mb-8">
              Ask me about heat risk, correlations, or generate advisories
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-[600px] mx-auto">
              {SUGGESTED.map(s => (
                <button 
                  key={s} 
                  onClick={() => send(s)} 
                  className="px-3.5 py-2 rounded-md bg-accent-muted border border-accent-border text-accent text-xs font-medium hover:bg-accent/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {agentMessages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-accent-muted' : 'bg-accent'}`}>
                {msg.role === 'user' ? <User size={14} className="text-accent" /> : <Bot size={14} color="var(--bg-base)" />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap shadow-token-sm ${
                msg.role === 'user' ? 'bg-accent-muted border border-accent-border text-primary' : 'bg-elevated border border-subtle text-primary'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-md shrink-0 bg-accent flex items-center justify-center">
              <Bot size={14} color="var(--bg-base)" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-xl bg-elevated border border-subtle text-primary text-sm leading-relaxed shadow-token-sm">
              {streamingText ? (
                <p className="whitespace-pre-wrap cursor">{streamingText}</p>
              ) : (
                <div className="flex gap-2 items-center py-1">
                  <span className="text-xs text-tertiary font-medium">Thinking</span>
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1 h-1 rounded-full bg-tertiary" style={{ animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-elevated border border-subtle rounded-xl flex gap-3 p-3 mt-2 shadow-token-sm">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask Meridian about heat risk, zones, correlations..."
          className="flex-1 bg-transparent border-none outline-none text-primary text-sm px-2"
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className={`px-4 py-2 rounded-md flex items-center justify-center transition-colors ${
            streaming || !input.trim() 
              ? 'bg-accent-muted text-tertiary cursor-not-allowed' 
              : 'bg-accent text-white hover:opacity-90'
          }`}
        >
          {streaming ? <Loader2 size={16} className="animate-spin text-accent" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
