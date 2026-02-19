import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/dashboard').then(setData).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return null;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Teacher Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Students</div>
          <div className="value">{data.num_students}</div>
        </div>
        <div className="stat-card">
          <div className="label">Average Score</div>
          <div className="value">{data.avg_score}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Recent Activity</div>
        {data.recent_activity.length === 0 ? (
          <div className="empty-state"><p>No activity yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Test</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{a.student}</td>
                    <td>{a.test}</td>
                    <td>
                      <span className={`badge badge-${a.score >= a.max_score * 0.8 ? 'success' : a.score >= a.max_score * 0.5 ? 'warning' : 'danger'}`}>
                        {a.score}/{a.max_score}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {a.date ? new Date(a.date).toLocaleDateString() : '-'}
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
