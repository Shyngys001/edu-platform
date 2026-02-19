import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/statistics').then(setStats).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!stats) return null;

  const scoreData = stats.test_scores.map(s => ({
    name: s.test_title.slice(0, 15),
    score: s.max_score ? Math.round((s.score / s.max_score) * 100) : 0,
    date: s.date,
  }));

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>My Statistics</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Completed Lessons</div>
          <div className="value">{stats.completed_lessons}/{stats.total_lessons}</div>
        </div>
        <div className="stat-card">
          <div className="label">Progress</div>
          <div className="value">{stats.progress_percent}%</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="fill" style={{ width: `${stats.progress_percent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Total Points</div>
          <div className="value">{stats.points}</div>
        </div>
        <div className="stat-card">
          <div className="label">Level</div>
          <div className="value">{stats.level}</div>
        </div>
      </div>

      {scoreData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">Test Scores Over Time</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} dot={{ fill: '#4F46E5' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.weak_topics.length > 0 && (
        <div className="card">
          <div className="card-header">Performance by Module</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.weak_topics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="module" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avg_score" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
