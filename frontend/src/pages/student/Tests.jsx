import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/tests').then(setTests).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Tests</h1>
      {tests.length === 0 ? (
        <div className="empty-state"><div className="icon">📝</div><p>No tests available yet</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tests.map(t => (
            <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tests/${t.id}`)}>
              <div className="card-header">{t.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge badge-${t.difficulty === 'easy' ? 'success' : t.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                  {t.difficulty}
                </span>
                <span className="badge badge-neutral">{t.question_count} questions</span>
              </div>
              {t.attempted && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Best score: <strong>{t.best_score}/{t.question_count}</strong>
                </div>
              )}
              {!t.attempted && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Not attempted yet</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
