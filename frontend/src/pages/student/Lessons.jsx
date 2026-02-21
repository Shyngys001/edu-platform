import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiCheck, FiBookOpen, FiLayers } from 'react-icons/fi';

const GRADES = [6, 7, 8, 9, 10, 11];

export default function Lessons() {
  const t = useT();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeInfo, setGradeInfo] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeGrade = searchParams.get('grade') ? parseInt(searchParams.get('grade')) : null;

  useEffect(() => {
    Promise.all([
      api.get('/student/modules'),
      api.get('/student/grades'),
    ]).then(([m, g]) => {
      setModules(m);
      setGradeInfo(g);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const maxUnlocked = gradeInfo?.max_unlocked_grade || 6;
  const currentGrade = gradeInfo?.current_grade || 6;

  // Filter lessons by grade if a grade tab is selected
  const filteredModules = modules.map(m => ({
    ...m,
    lessons: activeGrade ? m.lessons.filter(l => l.grade === activeGrade) : m.lessons,
  })).filter(m => m.lessons.length > 0);

  // Available grades (unlocked)
  const availableGrades = GRADES.filter(g => g <= maxUnlocked);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>{t('theoryLessons')}</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/grades')}>
          <FiLayers /> {t('gradeProgress')}
        </button>
      </div>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredModules.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><FiBookOpen /></div>
            <p>{t('noLessonsForGrade')}</p>
          </div>
        ) : filteredModules.map(m => (
          <div key={m.id} className="card">
            <div className="card-header">
              <span>{m.order}. {m.title}</span>
              <span className="badge badge-neutral">{m.lessons.filter(l => l.completed).length}/{m.lessons.length}</span>
            </div>
            {m.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{m.description}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {m.lessons.map(l => (
                <div
                  key={l.id}
                  onClick={() => navigate(`/student/lessons/${l.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                    background: l.completed ? '#F0FDF4' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = l.completed ? '#DCFCE7' : 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = l.completed ? '#F0FDF4' : 'transparent'}
                >
                  {l.completed ? (
                    <FiCheck style={{ color: 'var(--success)', flexShrink: 0 }} />
                  ) : (
                    <FiBookOpen style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: '0.9rem' }}>{l.title}</span>
                  {l.grade && l.grade !== currentGrade && (
                    <span className="badge badge-primary" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                      {t('gradeLabel')} {l.grade}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
