import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

export default function CodeTasks() {
  const t = useT();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/tasks').then(setTasks).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('codeTasks')}</h1>
      {tasks.length === 0 ? (
        <div className="empty-state"><div className="icon">💻</div><p>{t('noCodeTasksAvailable')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tasks.map(task => (
            <div key={task.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tasks/${task.id}`)}>
              <div className="card-header">{task.title}</div>
              <span className={`badge badge-${task.difficulty === 'easy' ? 'success' : task.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                {t(task.difficulty)}
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>{task.description.slice(0, 100)}...</p>
              {task.best_score !== null && (
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${task.max_score ? (task.best_score / task.max_score) * 100 : 0}%` }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('best')}: {task.best_score}/{task.max_score}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
