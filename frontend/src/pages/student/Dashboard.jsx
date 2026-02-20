import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const t = useT();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/profile').then(setProfile).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!profile) return null;

  const levelKey = profile.level === 'Advanced' ? 'levelAdvanced' : profile.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner';
  const levelColor = profile.level === 'Advanced' ? 'success' : profile.level === 'Intermediate' ? 'warning' : 'primary';

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('welcome')}, {profile.full_name}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">{t('level')}</div>
          <div className="value"><span className={`badge badge-${levelColor}`}>{t(levelKey)}</span></div>
        </div>
        <div className="stat-card">
          <div className="label">{t('totalPoints')}</div>
          <div className="value">{profile.points}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t('progress')}</div>
          <div className="value">{profile.progress_percent}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="fill" style={{ width: `${profile.progress_percent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="label">{t('lessonsLabel')}</div>
          <div className="value">{profile.completed_lessons}/{profile.total_lessons}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t('streak')}</div>
          <div className="value">{profile.streak_days} {t('days')}</div>
        </div>
        <div className="stat-card">
          <div className="label">{t('grade')}</div>
          <div className="value">{profile.grade || '-'}</div>
        </div>
      </div>

      {profile.badges.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">{t('myBadges')}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {profile.badges.map(b => (
              <div key={b.key} style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 12, minWidth: 100 }}>
                <div style={{ fontSize: '2rem' }}>{b.icon}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 4 }}>{b.title}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-cards-grid">
        <Link to="/student/lessons" className="card dashboard-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-header">{t('continueLearning')}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {profile.total_lessons - profile.completed_lessons} {t('lessonsRemaining')}
          </p>
        </Link>
        <Link to="/student/tests" className="card dashboard-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-header">{t('takeTest')}</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('testYourKnowledge')}
          </p>
        </Link>
      </div>
    </div>
  );
}
