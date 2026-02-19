import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/profile').then(setProfile).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!profile) return null;

  const levelColor = profile.level === 'Advanced' ? 'success' : profile.level === 'Intermediate' ? 'warning' : 'primary';

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Welcome, {profile.full_name}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Level</div>
          <div className="value"><span className={`badge badge-${levelColor}`}>{profile.level}</span></div>
        </div>
        <div className="stat-card">
          <div className="label">Total Points</div>
          <div className="value">{profile.points}</div>
        </div>
        <div className="stat-card">
          <div className="label">Progress</div>
          <div className="value">{profile.progress_percent}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="fill" style={{ width: `${profile.progress_percent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Lessons</div>
          <div className="value">{profile.completed_lessons}/{profile.total_lessons}</div>
        </div>
        <div className="stat-card">
          <div className="label">Streak</div>
          <div className="value">{profile.streak_days} days</div>
        </div>
        <div className="stat-card">
          <div className="label">Grade</div>
          <div className="value">{profile.grade || '-'}</div>
        </div>
      </div>

      {profile.badges.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">My Badges</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Link to="/student/lessons" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-header">Continue Learning</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {profile.total_lessons - profile.completed_lessons} lessons remaining
          </p>
        </Link>
        <Link to="/student/tests" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card-header">Take a Test</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Test your knowledge with quizzes
          </p>
        </Link>
      </div>
    </div>
  );
}
