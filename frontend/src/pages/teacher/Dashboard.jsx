import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* Custom colored bar shape (replaces deprecated Cell) */
function ColoredBar(props) {
  const { x, y, width, height, score } = props;
  const fill = score >= 80 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';
  const h = Math.max(height ?? 0, 0);
  return <rect x={x} y={y} width={width} height={h} fill={fill} rx={6} />;
}
import {
  FiUsers, FiBarChart2, FiTrendingUp, FiActivity,
  FiArrowRight, FiCheckCircle, FiAlertCircle, FiXCircle,
} from 'react-icons/fi';

/* ── Animated counter ────────────────────────────── */
function useCountUp(target, duration = 900) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    const startTime = performance.now();
    function step(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * ease));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return current;
}

/* ── Custom Tooltip ──────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)', padding: '8px 12px',
      boxShadow: 'var(--shadow-md)', fontSize: '0.82rem',
    }}>
      <p style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{label}</p>
      <p style={{ color: 'var(--brand)' }}>Ұпай: {payload[0].value}%</p>
    </div>
  );
}

export default function TeacherDashboard() {
  const t = useT();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard')
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const animStudents = useCountUp(data?.num_students ?? 0);
  const animAvg      = useCountUp(data ? parseFloat(data.avg_score) : 0);

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <div className="skeleton skeleton-title" style={{ width: 220, marginBottom: 8 }} />
          <div className="skeleton skeleton-text" style={{ width: 160 }} />
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 260, marginBottom: 16 }} />
        <div className="skeleton skeleton-card" style={{ height: 220 }} />
      </div>
    );
  }

  if (!data) return null;

  /* Score → performance stats */
  const recentScores = data.recent_activity.map(a =>
    a.max_score ? Math.round((a.score / a.max_score) * 100) : 0
  );
  const highCount    = recentScores.filter(s => s >= 80).length;
  const midCount     = recentScores.filter(s => s >= 50 && s < 80).length;
  const lowCount     = recentScores.filter(s => s < 50).length;

  /* Chart data — last 7 activities */
  const chartData = data.recent_activity.slice(0, 8).map(a => ({
    name: a.student?.split(' ')[0] ?? '?',
    score: a.max_score ? Math.round((a.score / a.max_score) * 100) : 0,
  }));

  function scoreColor(score, maxScore) {
    const pct = maxScore ? (score / maxScore) * 100 : 0;
    if (pct >= 80) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  }

  function scoreIcon(score, maxScore) {
    const pct = maxScore ? (score / maxScore) * 100 : 0;
    if (pct >= 80) return <FiCheckCircle style={{ color: 'var(--success)' }} />;
    if (pct >= 50) return <FiAlertCircle style={{ color: 'var(--warning)' }} />;
    return <FiXCircle style={{ color: 'var(--error)' }} />;
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      {/* Page Header */}
      <div className="page-heading" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>{t('teacherDashboard')}</h1>
          <p>{t('recentActivity')}</p>
        </div>
        <Link to="/teacher/students" className="btn btn-secondary btn-sm">
          {t('students')} <FiArrowRight />
        </Link>
      </div>

      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">{t('totalStudents')}</div>
          <div className="value">{animStudents}</div>
          <div className="sub">Белсенді оқушылар</div>
          <div className="stat-icon"><FiUsers /></div>
        </div>

        <div className="stat-card purple">
          <div className="label">{t('averageScore')}</div>
          <div className="value">{animAvg}%</div>
          <div className="sub">Жалпы орташа</div>
          <div className="stat-icon"><FiBarChart2 /></div>
        </div>

        <div className="stat-card success">
          <div className="label">Үздік оқушылар</div>
          <div className="value">{highCount}</div>
          <div className="sub">≥ 80% ұпай</div>
          <div className="stat-icon"><FiTrendingUp /></div>
        </div>

        <div className="stat-card warning">
          <div className="label">Назар қажет</div>
          <div className="value">{lowCount}</div>
          <div className="sub">&lt; 50% ұпай</div>
          <div className="stat-icon"><FiActivity /></div>
        </div>
      </div>

      {/* Chart + Table Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 0 }}>

        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            Соңғы тест нәтижелері
            <span className="badge badge-neutral">{data.recent_activity.length} нәтиже</span>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="icon">📊</div>
              <p>{t('noActivityYet')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)' }} />
                <Bar dataKey="score" shape={<ColoredBar />} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Distribution */}
        <div className="card">
          <div className="card-header">Ұпай бөлінісі</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Жоғары (≥80%)', count: highCount, total: recentScores.length, color: 'var(--success)', bg: 'var(--success-bg)' },
              { label: 'Орташа (50–79%)', count: midCount, total: recentScores.length, color: 'var(--warning)', bg: 'var(--warning-bg)' },
              { label: 'Төмен (<50%)', count: lowCount, total: recentScores.length, color: 'var(--error)', bg: 'var(--error-bg)' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: 700 }}>
                    {row.count} / {row.total}
                  </span>
                </div>
                <div className="progress-bar thick">
                  <div
                    className="fill"
                    style={{
                      width: `${row.total ? (row.count / row.total) * 100 : 0}%`,
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            ))}

            {recentScores.length === 0 && (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>{t('noActivityYet')}</p>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="card-section-title">Жылдам кіру</div>
            {[
              { to: '/teacher/analytics', label: t('analytics') },
              { to: '/teacher/students',  label: t('students') },
            ].map(l => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)', color: 'var(--text-1)',
                  fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                  border: '1px solid var(--border)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-1)'; }}
              >
                {l.label} <FiArrowRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          {t('recentActivity')}
          <span className="badge badge-neutral">{data.recent_activity.length}</span>
        </div>
        {data.recent_activity.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>{t('noActivityYet')}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('student')}</th>
                  <th>{t('test')}</th>
                  <th>{t('score')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.map((a, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--brand-gradient)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {a.student?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{a.student}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>{a.test}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {scoreIcon(a.score, a.max_score)}
                        <span className={`badge badge-${scoreColor(a.score, a.max_score)}`}>
                          {a.score}/{a.max_score}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                      {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
