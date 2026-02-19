import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function CodeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/tasks').then(setTasks).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Code Tasks</h1>
      {tasks.length === 0 ? (
        <div className="empty-state"><div className="icon">💻</div><p>No coding tasks available yet</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tasks.map(t => (
            <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tasks/${t.id}`)}>
              <div className="card-header">{t.title}</div>
              <span className={`badge badge-${t.difficulty === 'easy' ? 'success' : t.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                {t.difficulty}
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>{t.description.slice(0, 100)}...</p>
              {t.best_score !== null && (
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${t.max_score ? (t.best_score / t.max_score) * 100 : 0}%` }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Best: {t.best_score}/{t.max_score}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
