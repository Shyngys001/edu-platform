import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

const GRADES = [6, 7, 8, 9, 10, 11];

export default function Tests() {
  const t = useT();
  const [tests, setTests] = useState([]);
  const [gradeInfo, setGradeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeGrade = searchParams.get('grade') ? parseInt(searchParams.get('grade')) : null;

  useEffect(() => {
    Promise.all([
      api.get('/student/tests'),
      api.get('/student/grades'),
    ]).then(([tData, gData]) => {
      setTests(tData);
      setGradeInfo(gData);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const maxUnlocked = gradeInfo?.max_unlocked_grade || 6;
  const currentGrade = gradeInfo?.current_grade || 6;
  const availableGrades = GRADES.filter(g => g <= maxUnlocked);

  const filteredTests = activeGrade ? tests.filter(tt => tt.grade === activeGrade) : tests;

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>{t('tests')}</h1>

      {/* Grade Filter Tabs */}
      {availableGrades.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!activeGrade ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchParams({})}
          >
            {t('allGrades')}
          </button>
          {availableGrades.map(g => (
            <button
              key={g}
              className={`btn btn-sm ${activeGrade === g ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSearchParams({ grade: g })}
            >
              {t('gradeLabel')} {g}
              {g === currentGrade && (
                <span style={{ marginLeft: 4, background: 'var(--accent)', color: '#1C1917', fontSize: '0.65rem', padding: '1px 5px', borderRadius: 99 }}>
                  ★
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {filteredTests.length === 0 ? (
        <div className="empty-state"><div className="icon">📝</div><p>{t('noTestsAvailable')}</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filteredTests.map(test => (
            <div key={test.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/tests/${test.id}`)}>
              <div className="card-header">{test.title}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className={`badge badge-${test.difficulty === 'easy' ? 'success' : test.difficulty === 'hard' ? 'danger' : 'warning'}`}>
                  {t(test.difficulty)}
                </span>
                <span className="badge badge-neutral">{test.question_count} {t('questions')}</span>
                {test.grade && (
                  <span className="badge badge-primary">{t('gradeLabel')} {test.grade}</span>
                )}
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
