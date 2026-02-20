import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';

export default function Students() {
  const t = useT();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    loadStudents();
  }, [gradeFilter]);

  async function loadStudents() {
    setLoading(true);
    try {
      const url = gradeFilter ? `/teacher/students?grade=${gradeFilter}` : '/teacher/students';
      setStudents(await api.get(url));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id) {
    try {
      const d = await api.get(`/teacher/students/${id}`);
      setDetail(d);
      setSelected(id);
    } catch (e) {
      toast.error(e.message);
    }
  }

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('studentManagement')}</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-input" style={{ maxWidth: 200 }} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">{t('allGrades')}</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="students-layout" style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('name')}</th>
                      <th>{t('grade')}</th>
                      <th>{t('level')}</th>
                      <th>{t('points')}</th>
                      <th>{t('progress')}</th>
                      <th>{t('avgTestScore')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} onClick={() => openDetail(s.id)} style={{ cursor: 'pointer', background: selected === s.id ? '#EEF2FF' : undefined }}>
                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                        <td>{s.grade || '-'}</td>
                        <td><span className={`badge badge-${s.level === 'Advanced' ? 'success' : s.level === 'Intermediate' ? 'warning' : 'primary'}`}>{t(s.level === 'Advanced' ? 'levelAdvanced' : s.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner')}</span></td>
                        <td>{s.points}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className="fill" style={{ width: `${s.progress_percent}%` }} />
                            </div>
                            <span style={{ fontSize: '0.8rem' }}>{s.progress_percent}%</span>
                          </div>
                        </td>
                        <td>{s.avg_test_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {students.length === 0 && <div className="empty-state"><p>{t('noStudentsFound')}</p></div>}
            </div>
          </div>

          {detail && (
            <div style={{ width: 360, flexShrink: 0 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: '1.1rem' }}>{detail.full_name}</h2>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setDetail(null); setSelected(null); }}>{t('close')}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('grade')}</span><br/><strong>{detail.grade || '-'}</strong></div>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('level')}</span><br/><strong>{t(detail.level === 'Advanced' ? 'levelAdvanced' : detail.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner')}</strong></div>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('points')}</span><br/><strong>{detail.points}</strong></div>
                  <div><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('streak')}</span><br/><strong>{detail.streak_days} {t('days')}</strong></div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('progress')}</span>
                  <div className="progress-bar" style={{ marginTop: 4 }}>
                    <div className="fill" style={{ width: `${detail.progress_percent}%` }} />
                  </div>
                  <span style={{ fontSize: '0.75rem' }}>{detail.completed_lessons}/{detail.total_lessons} {t('lessonsLabel')}</span>
                </div>

                {detail.weak_topics?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('weakTopics')}</span>
                    {detail.weak_topics.slice(0, 3).map((w, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                        <span>{w.module}</span>
                        <span className={`badge badge-${w.avg_score >= 60 ? 'success' : w.avg_score >= 30 ? 'warning' : 'danger'}`}>{w.avg_score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {detail.test_history?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('recentTests')}</span>
                    {detail.test_history.slice(0, 5).map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem' }}>
                        <span>{t.test_title}</span>
                        <span>{t.score}/{t.max_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
