import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiZap } from 'react-icons/fi';

const LANG_OPTIONS = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'kz', label: '🇰🇿 Қазақша' },
];

const TEMPLATES = {
  basic: {
    title: 'Sum Two Numbers',
    description: `Write a program that reads two integers from input (each on a separate line) and prints their sum.

**Example:**
Input:
\`\`\`
3
5
\`\`\`
Output: \`8\``,
    starter_code: 'a = int(input())\nb = int(input())\n# Your code here\n',
    difficulty: 'easy',
    test_cases: [
      { input: '3\n5', expected_output: '8' },
      { input: '0\n0', expected_output: '0' },
      { input: '-1\n1', expected_output: '0' },
      { input: '100\n200', expected_output: '300' },
      { input: '-5\n-3', expected_output: '-8' },
    ],
  },
  string: {
    title: 'Count Uppercase Letters',
    description: `Write a program that reads a string and prints the number of uppercase letters.

**Example:**
Input: \`Hello World\`
Output: \`2\``,
    starter_code: 'text = input()\n# Your code here\n',
    difficulty: 'easy',
    test_cases: [
      { input: 'Hello World', expected_output: '2' },
      { input: 'ABC', expected_output: '3' },
      { input: 'abc', expected_output: '0' },
      { input: 'PyThOn', expected_output: '3' },
      { input: '', expected_output: '0' },
    ],
  },
  list: {
    title: 'Find Maximum in List',
    description: `Write a program that reads space-separated integers and prints the maximum value.

**Example:**
Input: \`3 1 7 2 5\`
Output: \`7\``,
    starter_code: 'nums = list(map(int, input().split()))\n# Your code here\n',
    difficulty: 'medium',
    test_cases: [
      { input: '3 1 7 2 5', expected_output: '7' },
      { input: '1', expected_output: '1' },
      { input: '-3 -1 -7', expected_output: '-1' },
      { input: '10 10 10', expected_output: '10' },
      { input: '0 100 -50 99', expected_output: '100' },
    ],
  },
  math: {
    title: 'Check Prime Number',
    description: `Write a program that reads a positive integer and prints \`True\` if it's prime, \`False\` otherwise.

**Example:**
Input: \`7\`
Output: \`True\``,
    starter_code: 'n = int(input())\n# Your code here\n',
    difficulty: 'hard',
    test_cases: [
      { input: '7', expected_output: 'True' },
      { input: '4', expected_output: 'False' },
      { input: '2', expected_output: 'True' },
      { input: '1', expected_output: 'False' },
      { input: '97', expected_output: 'True' },
    ],
  },
};

export default function CodeTasksCMS() {
  const [tasks, setTasks] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [testCases, setTestCases] = useState([{ input: '', expected_output: '' }]);
  const [form, setForm] = useState({
    title: '', description: '', module_id: '', difficulty: 'medium', starter_code: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLang, setAiLang] = useState('ru');
  const t = useT();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [tk, m] = await Promise.all([api.get('/teacher/code-tasks'), api.get('/teacher/modules')]);
      setTasks(tk);
      setModules(m);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function applyTemplate(key) {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    setForm({
      title: tpl.title,
      description: tpl.description,
      module_id: '',
      difficulty: tpl.difficulty,
      starter_code: tpl.starter_code,
    });
    setTestCases([...tpl.test_cases]);
    toast.success(`Template "${key}" applied`);
  }

  function resetForm() {
    setForm({ title: '', description: '', module_id: '', difficulty: 'medium', starter_code: '' });
    setTestCases([{ input: '', expected_output: '' }]);
  }

  function updateTestCase(i, field, val) {
    setTestCases(tc => tc.map((c, j) => j === i ? { ...c, [field]: val } : c));
  }

  function addTestCase() {
    setTestCases(tc => [...tc, { input: '', expected_output: '' }]);
  }

  function removeTestCase(i) {
    setTestCases(tc => tc.filter((_, j) => j !== i));
  }

  async function handleAIGenerate() {
    setAiLoading(true);
    try {
      const data = await api.post('/teacher/ai/generate-task', {
        module_id: form.module_id ? parseInt(form.module_id) : null,
        difficulty: form.difficulty,
        lang: aiLang,
      });
      // AI fills ALL fields
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        description: data.description || f.description,
        starter_code: data.starter_code || f.starter_code,
      }));
      if (data.test_cases && data.test_cases.length > 0) {
        setTestCases(data.test_cases);
      }
      toast.success(t('aiGenerated'));
    } catch (e) {
      toast.error(e.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const validCases = testCases.filter(tc => tc.expected_output.trim());
    if (validCases.length === 0) {
      toast.error('Add at least one test case with expected output');
      return;
    }
    try {
      await api.post('/teacher/code-tasks', {
        title: form.title,
        description: form.description,
        module_id: form.module_id ? parseInt(form.module_id) : null,
        difficulty: form.difficulty,
        starter_code: form.starter_code,
        test_cases: validCases,
      });
      toast.success('Task created');
      setShowCreate(false);
      resetForm();
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/teacher/code-tasks/${id}`);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>{t('codeTasksTitle')}</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}><FiPlus /> {t('newTask')}</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>{t('difficulty')}</th><th>{t('testCases')}</th><th>{t('actions')}</th></tr></thead>
            <tbody>
              {tasks.map(tk => (
                <tr key={tk.id}>
                  <td style={{ fontWeight: 600 }}>{tk.title}</td>
                  <td><span className={`badge badge-${tk.difficulty === 'easy' ? 'success' : tk.difficulty === 'hard' ? 'danger' : 'warning'}`}>{t(tk.difficulty)}</span></td>
                  <td>{tk.test_case_count}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(tk.id)}><FiTrash2 /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && <div className="empty-state"><p>{t('noData')}</p></div>}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h2>{t('createCodeTask')}</h2>

            {/* AI Generate Block */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, borderRadius: 12, marginBottom: 20, color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{t('aiGenerateTask')}</strong>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9, margin: '4px 0 0' }}>{t('aiGenerateTaskDesc')}</p>
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

            {/* Template selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>{t('useTemplate')}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { key: 'basic', label: t('templateBasic'), icon: '📥' },
                  { key: 'string', label: t('templateString'), icon: '🔤' },
                  { key: 'list', label: t('templateList'), icon: '📋' },
                  { key: 'math', label: t('templateMath'), icon: '🔢' },
                ].map(tpl => (
                  <button
                    key={tpl.key}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => applyTemplate(tpl.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>{tpl.icon}</span> {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>{t('description')}</label>
                <textarea className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>{t('module')}</label>
                  <select className="form-input" value={form.module_id} onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}>
                    <option value="">—</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
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
              <div className="form-group">
                <label>{t('starterCode')}</label>
                <textarea className="form-input" value={form.starter_code} onChange={e => setForm(f => ({ ...f, starter_code: e.target.value }))} rows={3} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>

              {/* Visual test case editor */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('testCases')} ({testCases.length})</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addTestCase}><FiPlus /> {t('addCase')}</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {testCases.map((tc, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8,
                      padding: 12, background: 'var(--bg)', borderRadius: 8,
                      alignItems: 'start',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('input')}</span>
                        <textarea
                          className="form-input"
                          value={tc.input}
                          onChange={e => updateTestCase(i, 'input', e.target.value)}
                          rows={2}
                          style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                          placeholder="stdin input"
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('expected')}</span>
                        <textarea
                          className="form-input"
                          value={tc.expected_output}
                          onChange={e => updateTestCase(i, 'expected_output', e.target.value)}
                          rows={2}
                          style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                          placeholder="expected stdout"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => removeTestCase(i)}
                        disabled={testCases.length <= 1}
                        style={{ marginTop: 16 }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
