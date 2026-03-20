import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import {
  FiStar, FiZap, FiTrendingUp, FiBook, FiActivity,
  FiLayers, FiArrowRight, FiCode, FiFileText,
} from 'react-icons/fi';

/* ── Animated counter hook ─────────────────────────── */
function useCountUp(target, duration = 900) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    const startTime = performance.now();
    const startVal = 0;
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCurrent(Math.round(startVal + (target - startVal) * ease));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return current;
}

/* ── KPI Card ──────────────────────────────────────── */
function KpiCard({ label, value, sub, icon, variant, delay = 0, raw }) {
  const animated = useCountUp(typeof raw === 'number' ? raw : 0);
  const display = typeof raw === 'number' ? animated : value;

  return (
    <div
      className={`stat-card ${variant || ''}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="label">{label}</div>
      <div className="value">{display}</div>
      {sub && <div className="sub">{sub}</div>}
      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
}

/* ── Progress Ring ─────────────────────────────────── */
function ProgressRing({ pct, size = 80, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#brandGrad)" strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={fill}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5046E5" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const ERROR_LABELS = {
  syntax: 'Синтаксис', variable: 'Айнымалы', loop: 'Цикл',
  condition: 'Шартты оператор', io: 'Енгізу/Шығару', logic: 'Логика',
};
const ERROR_COLORS = {
  syntax: '#F59E0B', variable: '#6366F1', loop: '#10B981',
  condition: '#3B82F6', io: '#EC4899', logic: '#EF4444',
};
const DIFF_COLOR = { easy: 'success', medium: 'warning', hard: 'danger' };
const DIFF_LABEL = { easy: 'Жеңіл', medium: 'Орташа', hard: 'Қиын' };

export default function StudentDashboard() {
  const t = useT();
  const [profile, setProfile] = useState(null);
  const [errorMap, setErrorMap] = useState(null);
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/student/profile'),
      api.get('/student/error-map').catch(() => null),
      api.get('/student/recommendations').catch(() => null),
    ]).then(([prof, em, rc]) => {
      setProfile(prof);
      setErrorMap(em);
      setRecs(rc);
    }).catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <div className="skeleton skeleton-title" style={{ width: 260, marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: 180 }} />
        </div>
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const levelKey   = profile.level === 'Advanced' ? 'levelAdvanced'
    : profile.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner';
  const levelColor = profile.level === 'Advanced' ? 'success'
    : profile.level === 'Intermediate' ? 'warning' : '';

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      {/* Page Header */}
      <div className="page-heading">
        <h1>
          {t('welcome')}, {profile.full_name.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.92rem' }}>
          {t('grade')}: <strong>{profile.grade || '—'}</strong>
          &ensp;·&ensp;
          <span className={`badge badge-${levelColor || 'primary'}`}>{t(levelKey)}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <KpiCard
          label={t('totalPoints')}
          raw={profile.points}
          sub={`${t('level')}: ${t(levelKey)}`}
          icon={<FiZap />}
          delay={0}
        />
        <KpiCard
          label={t('progress')}
          value={`${profile.progress_percent}%`}
          sub={
            <div style={{ marginTop: 6 }}>
              <div className="progress-bar thin">
                <div className="fill" style={{ width: `${profile.progress_percent}%` }} />
              </div>
            </div>
          }
          icon={<FiTrendingUp />}
          variant="purple"
          delay={60}
        />
        <KpiCard
          label={t('lessonsLabel')}
          value={`${profile.completed_lessons}/${profile.total_lessons}`}
          sub={`${profile.total_lessons - profile.completed_lessons} ${t('lessonsRemaining')}`}
          icon={<FiBook />}
          variant="success"
          delay={120}
        />
        <KpiCard
          label={t('streak')}
          raw={profile.streak_days}
          sub={t('days')}
          icon={<FiActivity />}
          variant="warning"
          delay={180}
        />
        <KpiCard
          label={t('grade')}
          value={profile.grade || '—'}
          sub={t('gradeProgress')}
          icon={<FiLayers />}
          delay={240}
        />
        <KpiCard
          label={t('myBadges')}
          raw={profile.badges.length}
          sub={profile.badges.length > 0 ? profile.badges.map(b => b.icon).join(' ') : '—'}
          icon={<FiStar />}
          delay={300}
        />
      </div>

      {/* Progress Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ProgressRing pct={profile.progress_percent} size={100} stroke={9} />
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                {profile.progress_percent}%
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>{t('progress')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 2 }}>
              {profile.completed_lessons} / {profile.total_lessons} {t('lessons')}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <div className="card-header">
            <span>{t('myBadges')}</span>
            <span className="badge badge-neutral">{profile.badges.length}</span>
          </div>
          {profile.badges.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 16px' }}>
              <div className="icon">🏅</div>
              <p>Белгі алу үшін сабақтар мен тесттерді аяқтаңыз!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {profile.badges.map(b => (
                <div
                  key={b.key}
                  style={{
                    textAlign: 'center', padding: '12px 14px',
                    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                    minWidth: 90, border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{b.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: 6, color: 'var(--text-1)' }}>{b.title}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-2)', marginTop: 2 }}>{b.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Қате картасы + Ұсыныстар ─────────────── */}
      {errorMap && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Error map card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 16 }}>
              🗺️ Қате картасы
              {errorMap.total_failed > 0 && (
                <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{errorMap.total_failed} қате</span>
              )}
            </div>
            {errorMap.total_attempts === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                Тапсырмаларды орындасаң, қате картасы пайда болады
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(errorMap.error_counts).map(([type, count]) => {
                  const maxCount = Math.max(...Object.values(errorMap.error_counts), 1);
                  const pct = Math.round((count / maxCount) * 100);
                  const isWeak = type === errorMap.weakest && count > 0;
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 3 }}>
                        <span style={{ fontWeight: isWeak ? 700 : 500, color: isWeak ? ERROR_COLORS[type] : 'var(--text-1)' }}>
                          {isWeak && '⚠️ '}{ERROR_LABELS[type]}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${pct}%`,
                          background: ERROR_COLORS[type] || 'var(--brand)',
                          transition: 'width 0.6s ease',
                          opacity: count === 0 ? 0.2 : 1,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>🎯 Жеке маршрут</div>
            {recs && (
              <>
                <p style={{ fontSize: '0.82rem', color: recs.weakest ? '#D97706' : 'var(--text-secondary)', marginBottom: 12, fontWeight: recs.weakest ? 600 : 400 }}>
                  {recs.message}
                </p>
                {recs.tasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recs.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/student/tasks/${task.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', borderRadius: 8,
                          background: 'var(--bg)', cursor: 'pointer',
                          border: '1px solid var(--border)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}
                      >
                        <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-1)' }}>
                          {task.title}
                        </span>
                        <span className={`badge badge-${DIFF_COLOR[task.difficulty] || 'secondary'}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                          {DIFF_LABEL[task.difficulty] || task.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--success)' }}>Барлық тапсырмаларды аяқтадың! 🎉</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card-section-title">Жылдам кіру</div>
      <div className="dashboard-cards-grid" style={{ marginBottom: 8 }}>
        <Link
          to="/student/lessons"
          className="card dashboard-card"
          style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--brand-soft)',
            transform: 'translate(30px, -30px)',
          }} />
          <FiBook size={24} style={{ color: 'var(--brand)', marginBottom: 10 }} />
          <div className="card-header" style={{ marginBottom: 4 }}>{t('continueLearning')}</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 14 }}>
            {profile.total_lessons - profile.completed_lessons} {t('lessonsRemaining')}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand)' }}>
            {t('lessons')} <FiArrowRight size={13} />
          </span>
        </Link>

        <Link
          to="/student/tests"
          className="card dashboard-card"
          style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(5,150,105,0.06)',
            transform: 'translate(30px, -30px)',
          }} />
          <FiFileText size={24} style={{ color: 'var(--success)', marginBottom: 10 }} />
          <div className="card-header" style={{ marginBottom: 4 }}>{t('takeTest')}</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 14 }}>
            {t('testYourKnowledge')}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: 'var(--success)' }}>
            {t('tests')} <FiArrowRight size={13} />
          </span>
        </Link>

        <Link
          to="/student/tasks"
          className="card dashboard-card"
          style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(217,119,6,0.05)',
            transform: 'translate(30px, -30px)',
          }} />
          <FiCode size={24} style={{ color: 'var(--warning)', marginBottom: 10 }} />
          <div className="card-header" style={{ marginBottom: 4 }}>{t('codeTasks')}</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 14 }}>
            {t('testYourKnowledge')}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: 'var(--warning)' }}>
            {t('codeTasks')} <FiArrowRight size={13} />
          </span>
        </Link>

        <Link
          to="/student/grades"
          className="card dashboard-card"
          style={{ textDecoration: 'none', color: 'inherit', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(124,58,237,0.05)',
            transform: 'translate(30px, -30px)',
          }} />
          <FiLayers size={24} style={{ color: '#7C3AED', marginBottom: 10 }} />
          <div className="card-header" style={{ marginBottom: 4 }}>{t('gradeProgress')}</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 14 }}>
            {t('grade')} {profile.grade}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', fontWeight: 600, color: '#7C3AED' }}>
            {t('gradeProgress')} <FiArrowRight size={13} />
          </span>
        </Link>
      </div>
    </div>
  );
}
