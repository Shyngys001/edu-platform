import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import { FiLock, FiCheckCircle, FiStar, FiGlobe, FiTrendingUp } from 'react-icons/fi';

export default function Grades() {
  const t = useT();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/grades').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="main-content loading"><div className="spinner" /></div>;
  if (!data) return null;

  const { current_grade, max_unlocked_grade, grades } = data;
  const regularGrades = grades.filter(g => g.grade !== 'global_final');
  const globalFinal = grades.find(g => g.grade === 'global_final');

  function handleGradeClick(gradeItem) {
    if (gradeItem.status === 'locked') return;
    navigate(`/student/lessons?grade=${gradeItem.grade}`);
  }

  function gradeIcon(gradeItem) {
    if (gradeItem.status === 'locked') return <FiLock style={{ fontSize: '1.8rem', color: 'var(--text-secondary)' }} />;
    if (gradeItem.completion_percent >= 100) return <FiCheckCircle style={{ fontSize: '1.8rem', color: 'var(--success)' }} />;
    return <FiTrendingUp style={{ fontSize: '1.8rem', color: 'var(--primary)' }} />;
  }

  function gradeStatusLabel(gradeItem) {
    if (gradeItem.status === 'locked') return t('locked');
    if (gradeItem.grade === current_grade) return t('currentGrade');
    if (gradeItem.completion_percent >= 100) return t('completed');
    return t('unlocked');
  }

  function statusClass(gradeItem) {
    if (gradeItem.status === 'locked') return 'locked';
    if (gradeItem.grade === current_grade) return 'current';
    if (gradeItem.completion_percent >= 100) return 'unlocked';
    return 'unlocked';
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{t('gradeProgress')}</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          {t('currentGrade')}: <strong>{t('gradeLabel')} {current_grade}</strong>
          {max_unlocked_grade > current_grade && (
            <span style={{ marginLeft: 12, color: 'var(--success)' }}>
              · {t('unlocked')}: {t('gradeLabel')} {max_unlocked_grade}
            </span>
          )}
        </p>
      </div>

      {/* Grade Cards */}
      <div className="grades-grid">
        {regularGrades.map(gradeItem => (
          <div
            key={gradeItem.grade}
            className={`grade-card ${statusClass(gradeItem)}`}
            onClick={() => handleGradeClick(gradeItem)}
            title={gradeItem.status === 'locked' ? t('lockedGrade') : ''}
          >
            <div className="grade-icon">{gradeIcon(gradeItem)}</div>
            <div className="grade-number">{gradeItem.grade}</div>
            <div className="grade-label">
              {t('gradeLabel')} · {gradeStatusLabel(gradeItem)}
            </div>

            {gradeItem.status !== 'locked' && gradeItem.total_content > 0 && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4, color: 'var(--text-secondary)' }}>
                  <span>{t('progress')}</span>
                  <span>{gradeItem.completion_percent}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="fill"
                    style={{
                      width: `${gradeItem.completion_percent}%`,
                      background: gradeItem.completion_percent >= 100 ? 'var(--success)' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>
            )}

            {gradeItem.status === 'locked' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                {t('lockedGrade')}
              </div>
            )}

            {gradeItem.total_content === 0 && gradeItem.status !== 'locked' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {t('noContent')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Global Final Card */}
      {globalFinal && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiGlobe /> {t('globalFinal')}
          </h2>
          <div
            className={`grade-card final ${globalFinal.status}`}
            style={{ maxWidth: 320 }}
            onClick={() => globalFinal.status !== 'locked' && navigate('/student/tests?global_final=1')}
          >
            <div className="grade-icon">
              {globalFinal.status === 'locked'
                ? <FiLock style={{ fontSize: '2rem', color: 'var(--text-secondary)' }} />
                : <FiStar style={{ fontSize: '2rem', color: 'var(--accent-dark)' }} />
              }
            </div>
            <div className="grade-number" style={{ fontSize: '1.4rem' }}>{t('globalFinal')}</div>
            <div className="grade-label">
              {globalFinal.status === 'locked' ? t('lockedGrade') : t('unlocked')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
