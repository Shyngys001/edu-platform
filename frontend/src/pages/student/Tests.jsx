import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

export default function Tests() {
  const t = useT();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/tests').then(setTests).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('tests')}</h1>
      {tests.length === 0 ? (
        <div className="empty-state"><div className="icon">📝</div><p>{t('noTestsAvailable')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tests.map(test => (
            <div key={test.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tests/${test.id}`)}>
              <div className="card-header">{test.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge badge-${test.difficulty === 'easy' ? 'success' : test.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                  {t(test.difficulty)}
                </span>
                <span className="badge badge-neutral">{test.question_count} {t('questions')}</span>
              </div>
              {test.attempted && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('bestScore')}: <strong>{test.best_score}/{test.question_count}</strong>
                </div>
              )}
              {!test.attempted && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{t('notAttempted')}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
