import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiChevronDown, FiChevronUp, FiUser, FiTrendingUp, FiBookOpen, FiAward } from 'react-icons/fi';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const t = useT();

  useEffect(() => {
    Promise.all([
      api.get('/teacher/analytics'),
      api.get('/teacher/students'),
    ]).then(([a, s]) => {
      setData(a);
      setStudents(s);
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  async function toggleStudent(id) {
    if (expandedStudent === id) {
      setExpandedStudent(null);
      setStudentDetail(null);
      return;
    }
    try {
      const detail = await api.get(`/teacher/students/${id}`);
      setStudentDetail(detail);
      setExpandedStudent(id);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data) return null;

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort();
  const filtered = selectedGrade === 'all' ? students : students.filter(s => s.grade === selectedGrade);

  // Stats per grade
  const gradeStats = grades.map(g => {
    const gradeStudents = students.filter(s => s.grade === g);
    const avgScore = gradeStudents.length
      ? Math.round(gradeStudents.reduce((sum, s) => sum + s.avg_test_score, 0) / gradeStudents.length)
      : 0;
    const avgProgress = gradeStudents.length
      ? Math.round(gradeStudents.reduce((sum, s) => sum + s.progress_percent, 0) / gradeStudents.length)
      : 0;
    return { grade: g, count: gradeStudents.length, avgScore, avgProgress };
  });

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('analyticsTitle')}</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <FiUser size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{students.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('totalStudents')}</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <FiTrendingUp size={24} style={{ color: 'var(--success)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {students.length ? Math.round(students.reduce((s, st) => s + st.avg_test_score, 0) / students.length) : 0}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('avgScore')}</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <FiBookOpen size={24} style={{ color: '#F59E0B', marginBottom: 8 }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {students.length ? Math.round(students.reduce((s, st) => s + st.progress_percent, 0) / students.length) : 0}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('avgProgress')}</div>
        </div>
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <FiAward size={24} style={{ color: '#EC4899', marginBottom: 8 }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{grades.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('totalGrades')}</div>
        </div>
      </div>

      {/* Module chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">{t('avgScoreByModule')}</div>
        {data.module_stats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.module_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="module" fontSize={11} angle={-15} textAnchor="end" height={70} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Bar dataKey="avg_score" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state"><p>{t('noData')}</p></div>
        )}
      </div>

      {/* Grade overview */}
      {gradeStats.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">{t('gradeOverview')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 16 }}>
            {gradeStats.map(g => (
              <div
                key={g.grade}
                onClick={() => setSelectedGrade(selectedGrade === g.grade ? 'all' : g.grade)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedGrade === g.grade ? 'var(--primary)' : 'var(--bg)',
                  color: selectedGrade === g.grade ? 'white' : 'inherit',
                  border: selectedGrade === g.grade ? 'none' : '1px solid var(--border)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{g.grade}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{g.count} {t('studentsCount')}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.75rem' }}>
                  <span>Score: {g.avgScore}%</span>
                  <span>Progress: {g.avgProgress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students table by grade */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('studentPerformance')} {selectedGrade !== 'all' && `— ${selectedGrade}`}</span>
          {selectedGrade !== 'all' && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGrade('all')}>{t('showAll')}</button>
          )}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('student')}</th>
                <th>{t('grade')}</th>
                <th>{t('level')}</th>
                <th>{t('progress')}</th>
                <th>{t('avgScore')}</th>
                <th>{t('points')}</th>
                <th>{t('streak')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <>
                  <tr key={s.id} onClick={() => toggleStudent(s.id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td><span className="badge badge-secondary">{s.grade || '—'}</span></td>
                    <td>{s.level}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                          <div style={{ width: `${s.progress_percent}%`, height: '100%', background: s.progress_percent >= 70 ? 'var(--success)' : s.progress_percent >= 40 ? '#F59E0B' : 'var(--danger)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', minWidth: 35 }}>{s.progress_percent}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.avg_test_score >= 70 ? 'success' : s.avg_test_score >= 40 ? 'warning' : 'danger'}`}>
                        {s.avg_test_score}%
                      </span>
                    </td>
                    <td>{s.points}</td>
                    <td>{s.streak_days} {t('days')}</td>
                    <td>{expandedStudent === s.id ? <FiChevronUp /> : <FiChevronDown />}</td>
                  </tr>
                  {expandedStudent === s.id && studentDetail && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={8} style={{ padding: 0, background: 'var(--bg)' }}>
                        <div style={{ padding: 20 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            {/* Test History */}
                            <div>
                              <strong style={{ fontSize: '0.85rem', marginBottom: 8, display: 'block' }}>{t('testHistory')}</strong>
                              {studentDetail.test_history.length > 0 ? (
                                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                  {studentDetail.test_history.map((th, i) => (
                                    <div key={i} style={{
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem',
                                    }}>
                                      <span>{th.test_title}</span>
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className={`badge badge-${th.max_score && (th.score / th.max_score >= 0.7) ? 'success' : 'warning'}`}>
                                          {th.score}/{th.max_score}
                                        </span>
                                        {th.date && <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                          {new Date(th.date).toLocaleDateString()}
                                        </span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('noTests')}</p>
                              )}
                            </div>
                            {/* Weak Topics */}
                            <div>
                              <strong style={{ fontSize: '0.85rem', marginBottom: 8, display: 'block' }}>{t('weakTopics')}</strong>
                              {studentDetail.weak_topics.length > 0 ? (
                                <div>
                                  {studentDetail.weak_topics.slice(0, 5).map((wt, i) => (
                                    <div key={i} style={{
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem',
                                    }}>
                                      <span>{wt.module}</span>
                                      <span className={`badge badge-${wt.avg_score >= 60 ? 'success' : wt.avg_score >= 30 ? 'warning' : 'danger'}`}>
                                        {wt.avg_score}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('noData')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty-state"><p>{t('noData')}</p></div>}
      </div>

      {/* Weak topics overall */}
      <div className="card">
        <div className="card-header" style={{ color: 'var(--danger)' }}>{t('weakTopicsLowest')}</div>
        {data.weak_topics.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t('module')}</th><th>{t('avgScore')}</th><th>{t('attempts')}</th></tr></thead>
              <tbody>
                {data.weak_topics.map((w, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{w.module}</td>
                    <td><span className={`badge badge-${w.avg_score >= 60 ? 'success' : w.avg_score >= 30 ? 'warning' : 'danger'}`}>{w.avg_score}%</span></td>
                    <td>{w.attempt_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><p>{t('noData')}</p></div>
        )}
      </div>
    </div>
  );
}
