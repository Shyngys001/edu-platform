import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiZap, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi';

const LANG_OPTIONS = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'kz', label: '🇰🇿 Қазақша' },
];

const GRADES = [6, 7, 8, 9, 10, 11];

export default function TestsCMS() {
  const [tests, setTests] = useState([]);
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTest, setEditTest] = useState(null); // test being edited
  const [viewTest, setViewTest] = useState(null);
  const [form, setForm] = useState({ title: '', module_id: '', difficulty: 'medium', grade: 6, topic_id: '', questions: [] });
  const [newQ, setNewQ] = useState({ question_type: 'mcq', text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLang, setAiLang] = useState('ru');
  const [editingQ, setEditingQ] = useState(null); // index of question being edited
  const t = useT();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [testsData, modulesData, topicsData] = await Promise.all([
        api.get('/teacher/tests'),
        api.get('/teacher/modules'),
        api.get('/teacher/topics'),
      ]);
      setTests(testsData);
      setModules(modulesData);
      setTopics(topicsData);
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

  async function openEditTest(testId) {
    try {
      const testData = await api.get(`/teacher/tests/${testId}`);
      setEditTest(testData);
      setForm({
        title: testData.title, module_id: testData.module_id || '',
        difficulty: testData.difficulty, grade: testData.grade || 6,
        topic_id: testData.topic_id || '', questions: testData.questions,
      });
      loadTopicsForGrade(testData.grade || 6);
      setEditingQ(null);
      setShowCreate(true);
    } catch (e) {
      toast.error(e.message);
    }
  }

  function addQuestion() {
    if (!newQ.text || !newQ.correct_answer) {
      toast.error('Fill in question text and correct answer');
      return;
    }
    const q = { ...newQ, order: form.questions.length + 1 };
    if (q.question_type === 'mcq' || q.question_type === 'find_bug' || q.question_type === 'choose_code') {
      q.options = q.options.filter(Boolean);
    } else if (q.question_type === 'matching') {
      try {
        q.options = JSON.parse(q.options_json || '{}');
        q.correct_answer = JSON.parse(q.correct_answer);
      } catch {
        toast.error('Invalid JSON for matching');
        return;
      }
    }
    setForm(f => ({ ...f, questions: [...f.questions, q] }));
    setNewQ({ question_type: 'mcq', text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' });
  }

  // Update a field on an existing question
  function updateQuestion(index, field, value) {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => i === index ? { ...q, [field]: value } : q),
    }));
  }

  // Update an option within a question's options array
  function updateQuestionOption(qIndex, optIndex, value) {
    setForm(f => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIndex || !Array.isArray(q.options)) return q;
        const opts = [...q.options];
        opts[optIndex] = value;
        return { ...q, options: opts };
      }),
    }));
  }

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      const data = await api.post('/teacher/ai/generate-test', {
        module_id: form.module_id ? parseInt(form.module_id) : null,
        difficulty: form.difficulty,
        num_questions: 5,
        lang: aiLang,
      });
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        questions: (data.questions || []).map((q, i) => ({ ...q, order: i + 1 })),
      }));
      setEditingQ(null);
      toast.success(t('aiGenerated'));
    } catch (e) {
      toast.error(e.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (form.questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    const payload = {
      ...form,
      module_id: form.module_id ? parseInt(form.module_id) : null,
      grade: parseInt(form.grade),
      topic_id: form.topic_id ? parseInt(form.topic_id) : null,
    };
    try {
      if (editTest) {
        const result = await api.put(`/teacher/tests/${editTest.id}`, payload);
        if (result.attempts_preserved) {
          toast.success(`Test updated. Questions kept (${result.attempt_count} attempts exist)`);
        } else {
          toast.success('Test updated');
        }
      } else {
        await api.post('/teacher/tests', payload);
        toast.success('Test created');
      }
      setShowCreate(false);
      setEditTest(null);
      setForm({ title: '', module_id: '', difficulty: 'medium', grade: 6, topic_id: '', questions: [] });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id, attemptCount) {
    if (attemptCount > 0) {
      toast.error(`Cannot delete: ${attemptCount} student attempt(s) exist. Edit instead.`);
      return;
    }
    if (!confirm('Delete this test?')) return;
    try {
      await api.delete(`/teacher/tests/${id}`);
      toast.success('Test deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleView(id) {
    try {
      const t = await api.get(`/teacher/tests/${id}`);
      setViewTest(t);
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{t('testsTitle')}</h1>
        <button className="btn btn-primary" onClick={() => { setEditTest(null); setForm({ title: '', module_id: '', difficulty: 'medium', grade: 6, topic_id: '', questions: [] }); setEditingQ(null); setShowCreate(true); }}><FiPlus /> {t('newTest')}</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Title</th><th>{t('gradeLabel')}</th><th>{t('difficulty')}</th><th>{t('questions')}</th><th>{t('actions')}</th></tr>
            </thead>
            <tbody>
              {tests.map(tt => (
                <tr key={tt.id}>
                  <td style={{ fontWeight: 600 }}>{tt.title}</td>
                  <td><span className="badge badge-primary">{t('gradeLabel')} {tt.grade || 6}</span></td>
                  <td><span className={`badge badge-${tt.difficulty === 'easy' ? 'success' : tt.difficulty === 'hard' ? 'danger' : 'warning'}`}>{tt.difficulty}</span></td>
                  <td>{tt.question_count}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleView(tt.id)}><FiEye /></button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditTest(tt.id)} title={t('edit')}><FiEdit2 /></button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(tt.id, tt.attempt_count || 0)}
                        title={tt.attempt_count > 0 ? `${tt.attempt_count} attempts` : t('delete')}
                        style={{ opacity: tt.attempt_count > 0 ? 0.5 : 1 }}
                      ><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tests.length === 0 && <div className="empty-state"><p>{t('noData')}</p></div>}
      </div>

      {/* View Test Modal */}
      {viewTest && (
        <div className="modal-overlay" onClick={() => setViewTest(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h2>{viewTest.title}</h2>
            {viewTest.questions.map((q, i) => (
              <div key={q.id} style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600 }}>Q{i + 1} ({q.question_type}): {q.text}</p>
                {Array.isArray(q.options) && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Options: {q.options.join(' | ')}</p>}
                <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Answer: {JSON.stringify(q.correct_answer)}</p>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={() => setViewTest(null)} style={{ marginTop: 16 }}>{t('close')}</button>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => { setShowCreate(false); setEditTest(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editTest ? t('editTest') : t('createTest')}</h2>

            {/* AI Generate Block */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, borderRadius: 12, marginBottom: 20, color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{t('aiGenerateTest')}</strong>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '4px 0 0' }}>{t('aiGenerateTestDesc')}</p>
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

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Title</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>{t('difficulty')}</label>
                  <select className="form-input" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">{t('easy')}</option>
                    <option value="medium">{t('medium')}</option>
                    <option value="hard">{t('hard')}</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                <label>{t('module')}</label>
                <select className="form-input" value={form.module_id} onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}>
                  <option value="">—</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>

              {/* Editable questions list */}
              {form.questions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ fontSize: '0.85rem', marginBottom: 8, display: 'block' }}>
                    {t('questions')} ({form.questions.length}):
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.questions.map((q, i) => (
                      <div key={i} style={{
                        background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)',
                        overflow: 'hidden',
                      }}>
                        {/* Question header - click to expand */}
                        <div
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', cursor: 'pointer',
                          }}
                          onClick={() => setEditingQ(editingQ === i ? null : i)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span style={{
                              background: 'var(--primary)', color: 'white', borderRadius: '50%',
                              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                            }}>{i + 1}</span>
                            <span style={{
                              fontSize: '0.8rem', fontWeight: 500,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              <span className={`badge badge-${q.question_type === 'mcq' ? 'primary' : q.question_type === 'matching' ? 'warning' : 'secondary'}`} style={{ fontSize: '0.65rem', marginRight: 6 }}>
                                {q.question_type}
                              </span>
                              {q.text.slice(0, 50)}{q.text.length > 50 ? '...' : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                            <FiEdit2 size={14} style={{ color: 'var(--primary)' }} />
                            {editingQ === i ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                            <button
                              type="button" className="btn btn-danger btn-sm"
                              onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) })); if (editingQ === i) setEditingQ(null); }}
                              style={{ marginLeft: 4, padding: '2px 6px' }}
                            ><FiTrash2 size={12} /></button>
                          </div>
                        </div>

                        {/* Expanded edit form */}
                        {editingQ === i && (
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                            <div className="form-group" style={{ marginTop: 12 }}>
                              <label style={{ fontSize: '0.75rem' }}>{t('type')}</label>
                              <select className="form-input" value={q.question_type} onChange={e => updateQuestion(i, 'question_type', e.target.value)}>
                                <option value="mcq">Multiple Choice</option>
                                <option value="find_bug">Find the Bug</option>
                                <option value="choose_code">Choose Code</option>
                                <option value="matching">Matching</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.75rem' }}>{t('questionText')}</label>
                              <textarea className="form-input" value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} rows={3} style={{ fontSize: '0.85rem' }} />
                            </div>

                            {/* Options editor for non-matching types */}
                            {q.question_type !== 'matching' && Array.isArray(q.options) && (
                              <div className="form-group">
                                <label style={{ fontSize: '0.75rem' }}>{t('options')}</label>
                                {q.options.map((opt, oi) => (
                                  <div key={oi} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                                    <span style={{
                                      width: 20, height: 20, borderRadius: '50%', fontSize: '0.65rem',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: opt === q.correct_answer ? 'var(--success)' : '#E5E7EB',
                                      color: opt === q.correct_answer ? 'white' : 'var(--text-secondary)',
                                      fontWeight: 600, flexShrink: 0,
                                    }}>{String.fromCharCode(65 + oi)}</span>
                                    <input
                                      className="form-input"
                                      value={opt}
                                      onChange={e => updateQuestionOption(i, oi, e.target.value)}
                                      style={{ fontSize: '0.85rem' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div className="form-group">
                                <label style={{ fontSize: '0.75rem' }}>{t('correctAnswer')}</label>
                                <input
                                  className="form-input"
                                  value={typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer)}
                                  onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
                                  style={{ fontSize: '0.85rem' }}
                                />
                              </div>
                              <div className="form-group">
                                <label style={{ fontSize: '0.75rem' }}>{t('explanation')}</label>
                                <input
                                  className="form-input"
                                  value={q.explanation || ''}
                                  onChange={e => updateQuestion(i, 'explanation', e.target.value)}
                                  style={{ fontSize: '0.85rem' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add question form */}
              <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <strong style={{ fontSize: '0.85rem', marginBottom: 8, display: 'block' }}>{t('addQuestion')}</strong>
                <div className="form-group">
                  <label>{t('type')}</label>
                  <select className="form-input" value={newQ.question_type} onChange={e => setNewQ(q => ({ ...q, question_type: e.target.value }))}>
                    <option value="mcq">Multiple Choice</option>
                    <option value="find_bug">Find the Bug</option>
                    <option value="choose_code">Choose Code</option>
                    <option value="matching">Matching</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('questionText')}</label>
                  <textarea className="form-input" value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} rows={2} />
                </div>

                {(newQ.question_type !== 'matching') && (
                  <div className="form-group">
                    <label>{t('options')}</label>
                    {newQ.options.map((opt, i) => (
                      <input key={i} className="form-input" style={{ marginBottom: 4 }} value={opt}
                        onChange={e => { const opts = [...newQ.options]; opts[i] = e.target.value; setNewQ(q => ({ ...q, options: opts })); }}
                        placeholder={`Option ${i + 1}`} />
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label>{t('correctAnswer')} {newQ.question_type === 'matching' ? '(JSON)' : ''}</label>
                  <input className="form-input" value={newQ.correct_answer} onChange={e => setNewQ(q => ({ ...q, correct_answer: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>{t('explanation')}</label>
                  <input className="form-input" value={newQ.explanation} onChange={e => setNewQ(q => ({ ...q, explanation: e.target.value }))} />
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}><FiPlus /> {t('addQuestion')}</button>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditTest(null); }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{editTest ? t('update') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
