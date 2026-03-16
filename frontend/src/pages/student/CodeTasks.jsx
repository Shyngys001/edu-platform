import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiChevronDown, FiChevronUp, FiPlay, FiCheckCircle } from 'react-icons/fi';

const GRADES = [6, 7, 8, 9, 10, 11];

const DIFF_COLOR = { easy: 'success', medium: 'warning', hard: 'danger' };
const DIFF_LABEL = { easy: 'Жеңіл', medium: 'Орташа', hard: 'Қиын' };

export default function CodeTasks() {
  const t = useT();
  const [tasks, setTasks] = useState([]);
  const [gradeInfo, setGradeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGrade, setActiveGrade] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/student/tasks'),
      api.get('/student/grades'),
    ]).then(([tk, g]) => {
      setTasks(tk);
      setGradeInfo(g);
      // Auto-open first module group
      const firstKey = getFirstModuleKey(tk);
      if (firstKey) setOpenModules({ [firstKey]: true });
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  function getFirstModuleKey(taskList) {
    if (!taskList.length) return null;
    const first = taskList[0];
    return first.module_id ? `m-${first.module_id}` : 'no-module';
  }

  function toggleModule(key) {
    setOpenModules(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const maxUnlocked = gradeInfo?.max_unlocked_grade || 6;
  const currentGrade = gradeInfo?.current_grade || 6;
  const availableGrades = GRADES.filter(g => g <= maxUnlocked);

  const filtered = activeGrade ? tasks.filter(tk => tk.grade === activeGrade) : tasks;

  // Group by module
  const groups = [];
  const seen = new Map(); // moduleKey → index in groups

  for (const task of filtered) {
    const key = task.module_id ? `m-${task.module_id}` : 'no-module';
    const label = task.module_title || 'Модульсіз тапсырмалар';
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({ key, label, tasks: [] });
    }
    groups[seen.get(key)].tasks.push(task);
  }

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>{t('codeTasks')}</h1>

      {/* Grade Filter Tabs */}
      {availableGrades.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!activeGrade ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveGrade(null)}
          >
            {t('allGrades')}
          </button>
          {availableGrades.map(g => (
            <button
              key={g}
              className={`btn btn-sm ${activeGrade === g ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveGrade(g)}
            >
              {t('gradeLabel')} {g}
              {g === currentGrade && (
                <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#1C1917', fontSize: '0.65rem', padding: '1px 5px', borderRadius: 99 }}>★</span>
              )}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="empty-state"><div className="icon">💻</div><p>{t('noCodeTasksAvailable')}</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(group => {
            const isOpen = !!openModules[group.key];
            const doneCount = group.tasks.filter(tk => tk.best_score !== null && tk.max_score && tk.best_score === tk.max_score).length;
            const total = group.tasks.length;

            return (
              <div key={group.key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Module header — click to expand */}
                <div
                  onClick={() => toggleModule(group.key)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 20px', cursor: 'pointer',
                    background: isOpen ? 'var(--brand-gradient)' : 'var(--surface)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--brand-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0,
                    }}>💻</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isOpen ? 'white' : 'var(--text-1)' }}>
                        {group.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isOpen ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)', marginTop: 2 }}>
                        {total} тапсырма
                        {doneCount > 0 && ` · ${doneCount} аяқталды`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Progress pill */}
                    <div style={{
                      fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px',
                      borderRadius: 99,
                      background: isOpen ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
                      color: isOpen ? 'white' : 'var(--text-secondary)',
                    }}>
                      {doneCount}/{total}
                    </div>
                    {isOpen
                      ? <FiChevronUp size={18} color={isOpen ? 'white' : 'var(--text-secondary)'} />
                      : <FiChevronDown size={18} color="var(--text-secondary)" />}
                  </div>
                </div>

                {/* Task list */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {group.tasks.map((task, idx) => {
                      const pct = task.max_score ? Math.round((task.best_score ?? 0) / task.max_score * 100) : 0;
                      const done = task.best_score !== null && task.best_score === task.max_score;
                      const attempted = task.best_score !== null;

                      return (
                        <div
                          key={task.id}
                          onClick={() => navigate(`/student/tasks/${task.id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 20px',
                            borderBottom: idx < group.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {/* Status icon */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: done ? '#DCFCE7' : attempted ? '#FEF3C7' : 'var(--bg)',
                            border: `2px solid ${done ? '#86EFAC' : attempted ? '#FCD34D' : 'var(--border)'}`,
                          }}>
                            {done
                              ? <FiCheckCircle size={16} color="#16A34A" />
                              : <FiPlay size={14} color={attempted ? '#D97706' : 'var(--text-secondary)'} />}
                          </div>

                          {/* Title + badges */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-1)', marginBottom: 4 }}>
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className={`badge badge-${DIFF_COLOR[task.difficulty] || 'secondary'}`} style={{ fontSize: '0.7rem' }}>
                                {DIFF_LABEL[task.difficulty] || task.difficulty}
                              </span>
                              {task.grade && (
                                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{t('gradeLabel')} {task.grade}</span>
                              )}
                            </div>
                          </div>

                          {/* Score / progress */}
                          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                            {attempted ? (
                              <>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: done ? '#16A34A' : '#D97706', marginBottom: 4 }}>
                                  {task.best_score}/{task.max_score}
                                </div>
                                <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', width: 72 }}>
                                  <div style={{
                                    height: '100%', borderRadius: 99,
                                    width: `${pct}%`,
                                    background: done ? '#22C55E' : 'var(--warning, #F59E0B)',
                                    transition: 'width 0.4s',
                                  }} />
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Басталмады</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
