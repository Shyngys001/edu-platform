import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSend } from 'react-icons/fi';

export default function FeedbackPage() {
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([api.get('/teacher/students'), api.get('/teacher/feedback')]);
      setStudents(s);
      setFeedback(f);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(e) {
    e.preventDefault();
    if (!selectedStudent || !message.trim()) {
      toast.error('Select a student and type a message');
      return;
    }
    setSending(true);
    try {
      await api.post('/teacher/feedback', { student_id: parseInt(selectedStudent), message });
      toast.success('Feedback sent');
      setMessage('');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Student Feedback</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">Send Feedback</div>
        <form onSubmit={sendFeedback}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Student</label>
              <select className="form-input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                <option value="">Select student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade})</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Message</label>
              <input className="form-input" value={message} onChange={e => setMessage(e.target.value)} placeholder="Your feedback..." />
            </div>
            <button className="btn btn-primary" type="submit" disabled={sending}>
              <FiSend /> {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">Sent Messages</div>
        {feedback.length === 0 ? (
          <div className="empty-state"><p>No feedback sent yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feedback.map(f => (
              <div key={f.id} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>To: {f.student_name}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge badge-${f.is_read ? 'success' : 'neutral'}`}>{f.is_read ? 'Read' : 'Unread'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
