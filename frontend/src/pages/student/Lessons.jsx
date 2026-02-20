import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiCheck, FiBookOpen } from 'react-icons/fi';

export default function Lessons() {
  const t = useT();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/modules').then(setModules).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('theoryLessons')}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {modules.map(m => (
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
