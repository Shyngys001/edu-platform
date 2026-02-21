import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

const GRADES = [6, 7, 8, 9, 10, 11];

export default function CodeTasks() {
  const t = useT();
  const [tasks, setTasks] = useState([]);
  const [gradeInfo, setGradeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeGrade = searchParams.get('grade') ? parseInt(searchParams.get('grade')) : null;

  useEffect(() => {
    Promise.all([
      api.get('/student/tasks'),
      api.get('/student/grades'),
    ]).then(([tk, g]) => {
      setTasks(tk);
      setGradeInfo(g);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const maxUnlocked = gradeInfo?.max_unlocked_grade || 6;
  const currentGrade = gradeInfo?.current_grade || 6;
  const availableGrades = GRADES.filter(g => g <= maxUnlocked);

  const filteredTasks = activeGrade ? tasks.filter(tk => tk.grade === activeGrade) : tasks;

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>{t('codeTasks')}</h1>

      {/* Grade Filter Tabs */}
      {availableGrades.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!activeGrade ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchParams({})}
          >
            {t('allGrades')}
          </button>
          {availableGrades.map(g => (
            <button
              key={g}
              className={`btn btn-sm ${activeGrade === g ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSearchParams({ grade: g })}
            >
              {t('gradeLabel')} {g}
              {g === currentGrade && (
                <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#1C1917', fontSize: '0.65rem', padding: '1px 5px', borderRadius: 99 }}>
                  ★
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="empty-state"><div className="icon">💻</div><p>{t('noCodeTasksAvailable')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredTasks.map(task => (
            <div key={task.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tasks/${task.id}`)}>
              <div className="card-header">{task.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className={`badge badge-${task.difficulty === 'easy' ? 'success' : task.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                  {t(task.difficulty)}
                </span>
                {task.grade && (
                  <span className="badge badge-primary">{t('gradeLabel')} {task.grade}</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {task.description ? task.description.slice(0, 100) + (task.description.length > 100 ? '...' : '') : ''}
              </p>
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
