import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle } from 'react-icons/fi';

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/feedback').then(setMessages).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  async function markRead(id) {
    try {
      await api.post(`/student/feedback/${id}/read`);
      setMessages(m => m.map(msg => msg.id === id ? { ...msg, is_read: true } : msg));
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Inbox</h1>
      {messages.length === 0 ? (
        <div className="empty-state"><div className="icon">📬</div><p>No messages yet</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(m => (
            <div
              key={m.id}
              className="card"
              style={{ background: m.is_read ? 'var(--bg-card)' : '#EEF2FF', cursor: m.is_read ? 'default' : 'pointer' }}
              onClick={() => !m.is_read && markRead(m.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ color: m.is_read ? 'var(--text-secondary)' : 'var(--primary)', marginTop: 2 }}>
                  {m.is_read ? <FiCheckCircle /> : <FiMail />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.teacher_name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
