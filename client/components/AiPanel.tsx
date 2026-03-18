'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTED = [
  'Which students need the most attention right now?',
  'Who has low confidence or fluency ratings?',
  'Which students have been inactive for over 2 weeks?',
  'Suggest 5 new speaking topics for intermediate students',
  'Who is struggling with grammar or hesitation?',
  'Which students are close to completing the roadmap?',
  'Summarise today\'s attendance',
];

const EXPORT_OPTIONS = [
  { label: '📊 Students CSV', type: 'excel' },
  { label: '📝 Session Notes CSV', type: 'notes-csv' },
  { label: '💬 Topics CSV', type: 'topics-csv' },
];

export default function AiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [exporting, setExporting] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    setError('');

    const userMsg: Message = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        messages: history.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages([...history, { role: 'assistant', content: data.reply }]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to get a response. Check that Groq API key is set or Ollama is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/ai/export?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = type === 'excel' ? 'students.csv' : type === 'notes-csv' ? 'session-notes.csv' : 'topics.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Export failed'); }
    finally { setExporting(''); }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/20 md:hidden" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 flex flex-col bg-white shadow-2xl border-l border-parchment">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-ink border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="font-display text-base font-semibold text-cream">AI Assistant</h2>
              <p className="text-white/40 text-xs">Live academy data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setError(''); }}
                className="text-white/40 hover:text-white/80 text-xs px-2 py-1 transition-colors rounded">
                Clear
              </button>
            )}
            <button onClick={onClose}
              className="text-white/40 hover:text-white text-lg leading-none w-7 h-7 flex items-center justify-center transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Export bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-parchment bg-parchment/30 overflow-x-auto flex-shrink-0">
          <span className="text-xs text-muted font-medium flex-shrink-0">Export:</span>
          {EXPORT_OPTIONS.map(opt => (
            <button key={opt.type} onClick={() => handleExport(opt.type)} disabled={!!exporting}
              className="flex-shrink-0 text-xs px-2.5 py-1 bg-white border border-parchment rounded-lg text-muted hover:text-ink hover:border-amber/40 transition-colors disabled:opacity-50">
              {exporting === opt.type ? '…' : opt.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Empty state with suggestions */}
          {messages.length === 0 && !loading && (
            <div>
              <div className="text-center py-5">
                <p className="text-3xl mb-2">🧠</p>
                <p className="font-semibold text-ink text-sm">Ask me anything about the academy</p>
                <p className="text-muted text-xs mt-1">I have live access to all student data, notes &amp; progress</p>
              </div>
              <div className="space-y-1.5">
                {SUGGESTED.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2.5 bg-parchment/50 hover:bg-parchment rounded-lg text-ink border border-parchment hover:border-amber/30 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber text-white rounded-br-sm'
                  : 'bg-parchment/60 text-ink border border-parchment rounded-bl-sm'
              }`}>
                {msg.role === 'assistant'
                  ? <FormattedMessage content={msg.content} />
                  : msg.content
                }
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-parchment/60 border border-parchment rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-muted ml-1">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-rose/10 border border-rose/20 rounded-xl px-4 py-3 text-xs text-rose">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-parchment p-4 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about students, weaknesses, topics… (Enter to send)"
              rows={2}
              className="flex-1 input resize-none text-sm py-2.5 min-h-0"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-4 py-2.5 flex-shrink-0 self-end disabled:opacity-50"
            >
              ↑
            </button>
          </div>
          <p className="text-[10px] text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </>
  );
}

// Renders **bold**, bullet lists, line breaks cleanly
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bullet points
        if (/^[-•*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-amber mt-0.5 flex-shrink-0 text-xs">●</span>
              <span>{renderBold(line.replace(/^[-•*]\s/, ''))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex gap-2">
              <span className="text-amber flex-shrink-0 text-xs font-bold mt-0.5 w-4">{num}.</span>
              <span>{renderBold(line.replace(/^\d+\.\s/, ''))}</span>
            </div>
          );
        }
        // Heading-like lines (all caps or ends with :)
        if (line.endsWith(':') && line.length < 60) {
          return <p key={i} className="font-semibold text-ink mt-2">{renderBold(line)}</p>;
        }
        return <p key={i}>{renderBold(line)}</p>;
      })}
    </div>
  );
}

function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p
      )}
    </>
  );
}