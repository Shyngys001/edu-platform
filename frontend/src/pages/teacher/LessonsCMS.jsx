import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiZap } from 'react-icons/fi';

const LANG_OPTIONS = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'kz', label: '🇰🇿 Қазақша' },
];

const GRADES = [6, 7, 8, 9, 10, 11];

export default function LessonsCMS() {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ module_id: '', title: '', content: '', image_url: '', video_url: '', order: 0, grade: 6, topic_id: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLang, setAiLang] = useState('ru');
  const t = useT();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, l, tp] = await Promise.all([
        api.get('/teacher/modules'),
        api.get('/teacher/lessons'),
        api.get('/teacher/topics'),
      ]);
      setModules(m);
      setLessons(l);
      setTopics(tp);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTopicsForGrade(grade) {
    try {
      const tp = await api.get(`/teacher/topics?grade=${grade}`);
      setTopics(tp);
    } catch {}
  }

  function openCreate() {
    setEditing(null);
    setForm({ module_id: modules[0]?.id || '', title: '', content: '', image_url: '', video_url: '', order: 0, grade: 6, topic_id: '' });
    setShowForm(true);
  }

  function openEdit(lesson) {
    setEditing(lesson.id);
    setForm({ module_id: lesson.module_id, title: lesson.title, content: lesson.content || '', image_url: lesson.image_url || '', video_url: lesson.video_url || '', order: lesson.order, grade: lesson.grade || 6, topic_id: lesson.topic_id || '' });
    loadTopicsForGrade(lesson.grade || 6);
    setShowForm(true);
  }

  async function handleAIGenerate() {
    const topic = form.title || prompt(t('enterTopic'));
    if (!topic) return;
    setAiLoading(true);
    try {
      const data = await api.post('/teacher/ai/generate-lesson', {
        module_id: form.module_id ? parseInt(form.module_id) : null,
        topic,
        lang: aiLang,
      });
      // AI fills ALL fields
      setForm(f => ({
        ...f,
        title: data.title || topic,
        content: data.content || '',
        video_url: data.video_url || f.video_url,
      }));
      toast.success(t('aiGenerated'));
    } catch (e) {
      toast.error(e.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        module_id: parseInt(form.module_id),
        order: parseInt(form.order),
        grade: parseInt(form.grade),
        topic_id: form.topic_id ? parseInt(form.topic_id) : null,
      };
      if (editing) {
        await api.put(`/teacher/lessons/${editing}`, payload);
        toast.success('Lesson updated');
      } else {
        await api.post('/teacher/lessons', payload);
        toast.success('Lesson created');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/teacher/lessons/${id}`);
      toast.success('Lesson deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleCreateModule() {
    const title = prompt('Module title:');
    if (!title) return;
    try {
      await api.post('/teacher/modules', { title, order: modules.length + 1 });
      toast.success('Module created');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{t('lessonsTitle')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleCreateModule}><FiPlus /> {t('module')}</button>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> {t('newLesson')}</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>{t('module')}</th><th>{t('gradeLabel')}</th><th>{t('order')}</th><th>Video</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.title}</td>
                  <td>{modules.find(m => m.id === l.module_id)?.title || '-'}</td>
                  <td><span className="badge badge-primary">{t('gradeLabel')} {l.grade || 6}</span></td>
                  <td>{l.order}</td>
                  <td>{l.video_url ? 'Yes' : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(l)}><FiEdit2 /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lessons.length === 0 && <div className="empty-state"><p>{t('noData')}</p></div>}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? t('editLesson') : t('createLesson')}</h2>

            {/* AI Generate Block */}
            {!editing && (
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, borderRadius: 12, marginBottom: 20, color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{t('aiGenerateLesson')}</strong>
                    <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '4px 0 0' }}>{t('aiGenerateLessonDesc')}</p>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleAIGenerate}
                    disabled={aiLoading}
                    style={{ background: 'white', color: '#764ba2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                  >
                    {aiLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <FiZap />}
                    {aiLoading ? t('generating') : t('generate')}
                  </button>
                </div>
                {/* Language selector */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {LANG_OPTIONS.map(lo => (
                    <button
                      key={lo.value}
                      type="button"
                      onClick={() => setAiLang(lo.value)}
                      style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: '0.8rem', fontWeight: 600,
                        background: aiLang === lo.value ? 'white' : 'rgba(255,255,255,0.2)',
                        color: aiLang === lo.value ? '#764ba2' : 'white',
                        transition: 'all 0.2s',
                      }}
                    >
                      {lo.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('module')}</label>
                <select className="form-input" value={form.module_id} onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('content')} (Markdown)</label>
                <textarea className="form-input" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={10} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>{t('gradeLabel')}</label>
                  <select
                    className="form-input"
                    value={form.grade}
                    onChange={e => {
                      const g = parseInt(e.target.value);
                      setForm(f => ({ ...f, grade: g, topic_id: '' }));
                      loadTopicsForGrade(g);
                    }}
                  >
                    {GRADES.map(g => <option key={g} value={g}>{t('gradeLabel')} {g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('topic')}</label>
                  <select
                    className="form-input"
                    value={form.topic_id}
                    onChange={e => setForm(f => ({ ...f, topic_id: e.target.value }))}
                  >
                    <option value="">— {t('noTopic')} —</option>
                    {topics.filter(tp => tp.grade === form.grade).map(tp => (
                      <option key={tp.id} value={tp.id}>{tp.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input className="form-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Video URL (YouTube)</label>
                <input className="form-input" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>{t('order')}</label>
                <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editing ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
