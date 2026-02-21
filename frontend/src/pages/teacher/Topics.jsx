import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import { FiPlus, FiEdit2, FiTrash2, FiList, FiStar, FiGlobe } from 'react-icons/fi';

const GRADES = [6, 7, 8, 9, 10, 11];

const emptyForm = {
  title: '', description: '', grade: 6, order_index: 0,
  is_final: false, is_global_final: false,
};

export default function Topics() {
  const t = useT();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const url = filterGrade ? `/teacher/topics?grade=${filterGrade}` : '/teacher/topics';
      const data = await api.get(url);
      setTopics(data);
    } catch {
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterGrade]);

  function openCreate() {
    setEditTopic(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(topic) {
    setEditTopic(topic);
    setForm({
      title: topic.title, description: topic.description || '',
      grade: topic.grade, order_index: topic.order_index,
      is_final: topic.is_final, is_global_final: topic.is_global_final,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editTopic) {
        await api.put(`/teacher/topics/${editTopic.id}`, form);
      } else {
        await api.post('/teacher/topics', form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(topic) {
    if (!window.confirm(`Delete topic "${topic.title}"?`)) return;
    try {
      await api.delete(`/teacher/topics/${topic.id}`);
      load();
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  }

  // Group topics by grade
  const grouped = {};
  for (const tp of topics) {
    if (!grouped[tp.grade]) grouped[tp.grade] = [];
    grouped[tp.grade].push(tp);
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>{t('topicManagement')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{t('topics')} — {t('grade6to11')}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> {t('createTopic')}
        </button>
      </div>

      {/* Grade Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${!filterGrade ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterGrade('')}
        >
          {t('allGrades')}
        </button>
        {GRADES.map(g => (
          <button
            key={g}
            className={`btn btn-sm ${filterGrade == g ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterGrade(g)}
          >
            {t('gradeLabel')} {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : topics.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><FiList /></div>
          <p>{t('noTopicsYet')}</p>
        </div>
      ) : (
        <div>
          {Object.keys(grouped).sort((a, b) => a - b).map(grade => (
            <div key={grade} className="topics-section">
              <div className="topic-header">
                <FiList />
                {t('gradeLabel')} {grade}
                <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>
                  ({grouped[grade].length} {t('topics')})
                </span>
              </div>
              <div className="card" style={{ padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('topic')}</th>
                      <th>{t('orderIndex')}</th>
                      <th>{t('isFinal')}</th>
                      <th>{t('isGlobalFinal')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[grade].map(tp => (
                      <tr key={tp.id}>
                        <td style={{ color: 'var(--text-secondary)', width: 50 }}>{tp.id}</td>
                        <td>
                          <strong>{tp.title}</strong>
                          {tp.description && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {tp.description}
                            </div>
                          )}
                        </td>
                        <td>{tp.order_index}</td>
                        <td>
                          {tp.is_final ? (
                            <span className="badge badge-accent"><FiStar /> {t('isFinal')}</span>
                          ) : '—'}
                        </td>
                        <td>
                          {tp.is_global_final ? (
                            <span className="badge badge-warning"><FiGlobe /> {t('isGlobalFinal')}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(tp)}>
                              <FiEdit2 />
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tp)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editTopic ? t('editTopic') : t('createTopic')}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>{t('topic')} *</label>
                <input
                  className="form-input" required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={t('topic')}
                />
              </div>
              <div className="form-group">
                <label>{t('description')}</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>{t('gradeLabel')} *</label>
                  <select
                    className="form-input"
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: parseInt(e.target.value) }))}
                  >
                    {GRADES.map(g => <option key={g} value={g}>{t('gradeLabel')} {g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('orderIndex')}</label>
                  <input
                    type="number" min="0" className="form-input"
                    value={form.order_index}
                    onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={form.is_final}
                    onChange={e => setForm(f => ({ ...f, is_final: e.target.checked }))}
                  />
                  {t('isFinal')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={form.is_global_final}
                    onChange={e => setForm(f => ({ ...f, is_global_final: e.target.checked }))}
                  />
                  {t('isGlobalFinal')}
                </label>
              </div>
              {error && <div className="badge badge-danger" style={{ marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
