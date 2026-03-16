import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { FiArrowLeft, FiPlay, FiSend, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function CodeEditorPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);   // { text, isError }
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedCase, setExpandedCase] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/student/tasks/${id}`).then(t => {
      setTask(t);
      setCode(t.starter_code || '');
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function runCode() {
    setRunning(true);
    setOutput(null);
    setResults(null);
    try {
      const res = await api.post('/student/code/run', { code, stdin });
      const text = res.error ? res.error : (res.output || '(нәтиже жоқ)');
      setOutput({ text, isError: !!res.error && !res.passed });
    } catch (e) {
      setOutput({ text: `Қате: ${e.message}`, isError: true });
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    setSubmitting(true);
    setOutput(null);
    setResults(null);
    try {
      const res = await api.post(`/student/tasks/${id}/submit`, { code });
      setResults(res);
      const passed = res.results?.filter(r => r.passed).length ?? 0;
      const total = res.results?.length ?? res.max_score;
      if (passed === total) {
        toast.success(`Барлық тест өтті! ${res.score}/${res.max_score} ✓`);
      } else {
        toast(`${passed}/${total} тест өтті`, { icon: passed > 0 ? '⚠️' : '❌' });
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!task) return <div className="empty-state"><p>Тапсырма табылмады</p></div>;

  const passedCount = results?.results?.filter(r => r.passed).length ?? 0;
  const totalCount = results?.results?.length ?? 0;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/tasks')} style={{ marginBottom: 16 }}>
        <FiArrowLeft /> Артқа
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: description */}
        <div>
          <div className="card">
            <div className="card-header">{task.title}</div>
            <span className={`badge badge-${task.difficulty === 'easy' ? 'success' : task.difficulty === 'hard' ? 'danger' : 'warning'}`} style={{ marginBottom: 12, display: 'inline-flex' }}>
              {task.difficulty === 'easy' ? 'Жеңіл' : task.difficulty === 'hard' ? 'Қиын' : 'Орташа'}
            </span>
            <MarkdownRenderer content={task.description} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 12 }}>
              {task.test_case_count} тест жағдайы
            </p>
          </div>
        </div>

        {/* Right: editor + run + results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Editor card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Код редакторы</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={runCode} disabled={running || submitting}>
                  <FiPlay /> {running ? 'Орындалуда...' : 'Іске қос'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={submitting || running}>
                  <FiSend /> {submitting ? 'Тексерілуде...' : 'Жіберу'}
                </button>
              </div>
            </div>
            <Editor
              height="320px"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 }, scrollBeyondLastLine: false }}
            />
          </div>

          {/* Stdin input */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Кіріс деректер (stdin) — «Іске қос» үшін
            </label>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Мысалы: 3&#10;5"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          {/* Run output */}
          {output !== null && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 8,
                background: output.isError ? 'var(--error-bg, #FEF2F2)' : 'var(--success-bg, #F0FDF4)',
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {output.isError ? '❌ Қате' : '✅ Нәтиже'}
                </span>
              </div>
              <pre style={{
                background: '#1E1E2E', color: output.isError ? '#F38BA8' : '#CDD6F4',
                padding: '12px 16px', margin: 0,
                fontSize: '0.85rem', whiteSpace: 'pre-wrap', overflowX: 'auto',
                minHeight: 48,
              }}>
                {output.text}
              </pre>
            </div>
          )}

          {/* Submit results */}
          {results && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: allPassed ? 'var(--success-bg, #F0FDF4)' : passedCount > 0 ? '#FFFBEB' : 'var(--error-bg, #FEF2F2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{allPassed ? '🎉' : passedCount > 0 ? '⚠️' : '❌'}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {allPassed ? 'Барлық тест өтті!' : `${passedCount}/${totalCount} тест өтті`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Ұпай: {results.score}/{results.max_score}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="badge badge-success">{passedCount} ✓</span>
                  {totalCount - passedCount > 0 && <span className="badge badge-danger">{totalCount - passedCount} ✗</span>}
                </div>
              </div>

              {/* Test cases */}
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.results?.map((r, i) => (
                  <div key={i} style={{
                    borderRadius: 8,
                    border: `1px solid ${r.passed ? '#BBF7D0' : '#FECACA'}`,
                    overflow: 'hidden',
                  }}>
                    {/* Case header */}
                    <div
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', cursor: 'pointer',
                        background: r.passed ? '#F0FDF4' : '#FEF2F2',
                      }}
                      onClick={() => setExpandedCase(expandedCase === i ? null : i)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', fontSize: '0.65rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: r.passed ? '#059669' : '#DC2626', color: 'white', fontWeight: 700,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: r.passed ? '#065F46' : '#991B1B' }}>
                          {r.passed ? 'ӨТТІ' : 'ӨТПЕДІ'}
                        </span>
                        {r.input !== undefined && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            stdin: {String(r.input).replace(/\n/g, ' ↵ ').slice(0, 30)}{String(r.input).length > 30 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {expandedCase === i ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedCase === i && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--bg)',
                        borderTop: `1px solid ${r.passed ? '#BBF7D0' : '#FECACA'}`,
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                        fontSize: '0.8rem',
                      }}>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>Кіріс (stdin)</div>
                          <pre style={{
                            background: '#1E1E2E', color: '#CDD6F4',
                            padding: '6px 8px', borderRadius: 6, margin: 0,
                            fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                            minHeight: 28,
                          }}>{r.input || '(бос)'}</pre>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>Күтілетін шығыс</div>
                          <pre style={{
                            background: '#1E1E2E', color: '#A6E3A1',
                            padding: '6px 8px', borderRadius: 6, margin: 0,
                            fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                            minHeight: 28,
                          }}>{r.expected}</pre>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ color: 'var(--text-secondary)', marginBottom: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>Сіздің шығысыңыз</div>
                          <pre style={{
                            background: '#1E1E2E', color: r.passed ? '#A6E3A1' : '#F38BA8',
                            padding: '6px 8px', borderRadius: 6, margin: 0,
                            fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                            minHeight: 28,
                          }}>{r.actual || '(бос)'}</pre>
                        </div>
                        {r.error && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ color: '#DC2626', marginBottom: 3, textTransform: 'uppercase', fontSize: '0.7rem' }}>Қате</div>
                            <pre style={{
                              background: '#1E1E2E', color: '#F38BA8',
                              padding: '6px 8px', borderRadius: 6, margin: 0,
                              fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                            }}>{r.error}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
