import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { FiArrowLeft, FiPlay, FiSend } from 'react-icons/fi';

export default function CodeEditorPage() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/student/tasks/${id}`).then(t => {
      setTask(t);
      setCode(t.starter_code || '');
    }).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function runCode() {
    setRunning(true);
    setOutput('');
    setResults(null);
    try {
      // Use Pyodide for client-side execution
      if (window.pyodide) {
        const result = await window.pyodide.runPythonAsync(code);
        setOutput(String(result ?? ''));
      } else {
        setOutput('(Pyodide not loaded — use Submit to run against test cases on server)');
      }
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  async function submitCode() {
    setSubmitting(true);
    setResults(null);
    try {
      const res = await api.post(`/student/tasks/${id}/submit`, { code });
      setResults(res);
      toast.success(`Score: ${res.score}/${res.max_score}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!task) return <div className="empty-state"><p>Task not found</p></div>;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/tasks')} style={{ marginBottom: 16 }}>
        <FiArrowLeft /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: description */}
        <div>
          <div className="card">
            <div className="card-header">{task.title}</div>
            <span className={`badge badge-${task.difficulty === 'easy' ? 'success' : task.difficulty === 'hard' ? 'danger' : 'warning'}`} style={{ marginBottom: 12, display: 'inline-flex' }}>
              {task.difficulty}
            </span>
            <MarkdownRenderer content={task.description} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 12 }}>
              {task.test_case_count} test cases
            </p>
          </div>
        </div>

        {/* Right: editor + output */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Code Editor</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={runCode} disabled={running}>
                  <FiPlay /> {running ? 'Running...' : 'Run'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={submitting}>
                  <FiSend /> {submitting ? 'Checking...' : 'Submit'}
                </button>
              </div>
            </div>
            <Editor
              height="350px"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 12 }, scrollBeyondLastLine: false }}
            />
          </div>

          {/* Output */}
          {output && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-header">Output</div>
              <pre style={{ background: '#1E1E2E', color: '#CDD6F4', padding: 12, borderRadius: 8, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {output}
              </pre>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-header">
                Test Results: {results.score}/{results.max_score}
              </div>
              {results.results?.map((r, i) => (
                <div key={i} style={{
                  padding: '10px 14px', marginBottom: 4, borderRadius: 8,
                  background: r.passed ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${r.passed ? '#BBF7D0' : '#FECACA'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Case {r.case}</span>
                    <span className={`badge badge-${r.passed ? 'success' : 'danger'}`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  {!r.passed && (
                    <div style={{ fontSize: '0.8rem', marginTop: 6, color: 'var(--text-secondary)' }}>
                      <div>Input: <code>{r.input}</code></div>
                      <div>Expected: <code>{r.expected}</code></div>
                      <div>Got: <code>{r.actual || '(empty)'}</code></div>
                      {r.error && <div style={{ color: 'var(--danger)' }}>Error: {r.error}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
