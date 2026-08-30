'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { agentApi } from '@/lib/api/analysis';
import { Bot, Send, Trash2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { API_BASE } from '@/lib/api/client';

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
    setIsAtBottom(true);

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
        content: `Connection error. Make sure the API is running on ${API_BASE}`,
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
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Meridian AI Agent</h1>
          <p className="text-sm text-secondary mt-1">
            Powered by Groq · Ask anything about urban heat
          </p>
        </div>
        {agentMessages.length > 0 && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={clearAgentMessages} 
            className="text-risk-extreme hover:bg-risk-extreme/10"
          >
            <Trash2 size={14} className="mr-1.5" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-2"
      >
        {agentMessages.length === 0 && !streaming && (
          <div className="h-full flex flex-col items-center justify-center -mt-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-accent flex items-center justify-center">
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
          </div>
        )}

        {agentMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-accent-muted' : 'bg-accent'}`}>
              {msg.role === 'user' ? <User size={14} className="text-accent" /> : <Bot size={14} color="var(--bg-base)" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-md text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-accent-muted border border-accent-border text-primary' : 'bg-elevated border border-subtle text-primary'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streaming && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-md shrink-0 bg-accent flex items-center justify-center">
              <Bot size={14} color="var(--bg-base)" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-md bg-elevated border border-subtle text-primary text-sm leading-relaxed">
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
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-elevated border border-subtle rounded-md flex gap-3 p-3 mt-2 shrink-0 focus-within:border-accent/50 transition-colors">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask Meridian about heat risk, zones, correlations..."
          className="flex-1 bg-transparent border-none outline-none text-primary text-sm px-2"
        />
        <Button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="px-4"
        >
          {streaming ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} />}
        </Button>
      </div>
    </div>
  );
}
