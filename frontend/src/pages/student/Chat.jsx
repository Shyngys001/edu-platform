import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiSend, FiTrash2 } from 'react-icons/fi';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const t = useT();

  useEffect(() => {
    api.get('/student/chat/history').then(setMessages).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const text = input.trim();
    const userMsg = { role: 'user', content: text, id: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/student/chat', { message: text });
      setMessages(m => [...m, { role: 'assistant', content: res.response, id: res.id }]);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function renderContent(text) {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return <pre key={i} style={{ margin: '8px 0' }}><code>{code}</code></pre>;
      }
      // Handle bold, inline code, newlines
      return <span key={i}>{part.split('\n').map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {renderInline(line)}
        </span>
      ))}</span>;
    });
  }

  function renderInline(text) {
    // Bold
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((seg, j) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={j}>{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return <code key={j} style={{
          background: 'rgba(0,0,0,0.08)', padding: '2px 5px',
          borderRadius: 3, fontSize: '0.85em', fontFamily: 'monospace',
        }}>{seg.slice(1, -1)}</code>;
      }
      return seg;
    });
  }

  const quickPrompts = [
    { icon: '📝', text: 'What is a variable in Python?' },
    { icon: '🔄', text: 'How do for loops work?' },
    { icon: '🐛', text: 'How to debug errors?' },
    { icon: '📖', text: 'Explain list comprehensions' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>{t('aiPythonHelper')}</h1>
        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>GPT-powered</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div style={{ padding: 24 }}>
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="icon">🤖</div>
                  <p style={{ marginBottom: 16 }}>{t('askAboutPython')}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {quickPrompts.map((q, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary btn-sm"
                      style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '10px 14px' }}
                      onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                    >
                      <span>{q.icon}</span> {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-bubble ${m.role}`}>
                {m.role === 'assistant' && <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: 4 }}>AI Assistant</div>}
                {renderContent(m.content)}
              </div>
            ))}
            {sending && (
              <div className="chat-bubble assistant" style={{ padding: '14px 18px' }}>
                <div className="typing-indicator" style={{ padding: 0 }}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>
          <form className="chat-input-area" onSubmit={send}>
            <input
              ref={inputRef}
              className="form-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('typeMessage')}
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
            />
            <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()}>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
