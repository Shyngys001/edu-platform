import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/leaderboard').then(setData).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Leaderboard</h1>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Level</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '1.2rem' }}>{medals[i] || u.rank}</td>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.grade || '-'}</td>
                  <td>
                    <span className={`badge badge-${u.level === 'Advanced' ? 'success' : u.level === 'Intermediate' ? 'warning' : 'primary'}`}>
                      {u.level}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{u.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && <div className="empty-state"><p>No students yet</p></div>}
      </div>
    </div>
  );
}
