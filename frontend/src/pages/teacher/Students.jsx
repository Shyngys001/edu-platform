import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function Students() {
  const t = useT();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', username: '', grade: '', password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadStudents(); }, [gradeFilter]);

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

  function openEdit(student) {
    setEditForm({
      full_name: student.full_name || '',
      username: student.username || '',
      grade: student.grade || '',
      password: '',
    });
    setEditModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: editForm.full_name || undefined,
        username: editForm.username || undefined,
        grade: editForm.grade || undefined,
      };
      if (editForm.password) payload.password = editForm.password;

      await api.put(`/teacher/students/${selected}`, payload);
      toast.success(t('saved'));
      setEditModal(false);
      // Refresh detail and list
      await openDetail(selected);
      loadStudents();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('confirmDeleteStudent'))) return;
    try {
      await api.delete(`/teacher/students/${selected}`);
      toast.success(t('studentDeleted'));
      setDetail(null);
      setSelected(null);
      loadStudents();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort();

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>{t('studentManagement')}</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          className="form-input"
          style={{ maxWidth: 200 }}
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
        >
          <option value="">{t('allGrades')}</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <div className="students-layout" style={{ display: 'flex', gap: 20 }}>
          {/* Table */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
                      <tr
                        key={s.id}
                        onClick={() => openDetail(s.id)}
                        style={{ cursor: 'pointer', background: selected === s.id ? '#EFF6FF' : undefined }}
                      >
                        <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                        <td>{s.grade || '—'}</td>
                        <td>
                          <span className={`badge badge-${s.level === 'Advanced' ? 'success' : s.level === 'Intermediate' ? 'warning' : 'primary'}`}>
                            {t(s.level === 'Advanced' ? 'levelAdvanced' : s.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner')}
                          </span>
                        </td>
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

          {/* Detail Panel */}
          {detail && (
            <div style={{ width: 360, flexShrink: 0 }}>
              <div className="card">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: 2 }}>{detail.full_name}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{detail.username}</div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setDetail(null); setSelected(null); }}
                    style={{ padding: '4px 8px' }}
                  >
                    <FiX />
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openEdit(detail)}
                  >
                    <FiEdit2 style={{ marginRight: 4 }} />{t('edit')}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1 }}
                    onClick={handleDelete}
                  >
                    <FiTrash2 style={{ marginRight: 4 }} />{t('delete')}
                  </button>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('grade')}</span>
                    <br /><strong>{detail.grade || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('level')}</span>
                    <br /><strong>{t(detail.level === 'Advanced' ? 'levelAdvanced' : detail.level === 'Intermediate' ? 'levelIntermediate' : 'levelBeginner')}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('points')}</span>
                    <br /><strong>{detail.points}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('streak')}</span>
                    <br /><strong>{detail.streak_days} {t('days')}</strong>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('progress')}</span>
                  <div className="progress-bar" style={{ marginTop: 4 }}>
                    <div className="fill" style={{ width: `${detail.progress_percent}%` }} />
                  </div>
                  <span style={{ fontSize: '0.75rem' }}>{detail.completed_lessons}/{detail.total_lessons} {t('lessonsLabel')}</span>
                </div>

                {/* Weak topics */}
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

                {/* Test history */}
                {detail.test_history?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('recentTests')}</span>
                    {detail.test_history.slice(0, 5).map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem' }}>
                        <span>{h.test_title}</span>
                        <span>{h.score}/{h.max_score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ marginBottom: 20 }}>{t('editStudent')}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{t('fullName')} *</label>
                <input
                  className="form-input"
                  value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('username')} *</label>
                <input
                  className="form-input"
                  value={editForm.username}
                  onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('grade')}</label>
                <input
                  className="form-input"
                  value={editForm.grade}
                  onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}
                  placeholder="10A"
                />
              </div>
              <div className="form-group">
                <label>{t('newPassword')}</label>
                <input
                  type="password"
                  className="form-input"
                  value={editForm.password}
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('leaveBlankToKeep')}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '...' : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
