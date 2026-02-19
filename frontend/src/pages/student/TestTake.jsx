import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

export default function TestTake() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/student/tests/${id}`).then(setTest).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [id]);

  function setAnswer(qId, value) {
    setAnswers(a => ({ ...a, [qId]: value }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < (test?.questions?.length || 0)) {
      toast.error('Please answer all questions');
      return;
    }
    setSubmitting(true);
    const seconds = Math.round((Date.now() - startTime.current) / 1000);
    try {
      const res = await api.post(`/student/tests/${id}/submit`, { answers, time_spent_seconds: seconds });
      setResult(res);
      toast.success(`Score: ${res.score}/${res.max_score}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!test) return <div className="empty-state"><p>Test not found</p></div>;

  if (result) {
    return (
      <div>
        <h1 style={{ marginBottom: 16 }}>Results: {test.title}</h1>
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="label">Score</div>
            <div className="value">{result.score}/{result.max_score}</div>
          </div>
          <div className="stat-card">
            <div className="label">Percentage</div>
            <div className="value">{result.max_score ? Math.round(result.score / result.max_score * 100) : 0}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Time</div>
            <div className="value">{Math.round(result.time_spent_seconds / 60)}m</div>
          </div>
        </div>

        {result.wrong_answers?.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ color: 'var(--danger)' }}>Wrong Answers Review</div>
            {result.wrong_answers.map((w, i) => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>{w.text}</p>
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Your answer: {JSON.stringify(w.your_answer)}</p>
                <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Correct: {JSON.stringify(w.correct_answer)}</p>
                {w.explanation && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>{w.explanation}</p>}
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-primary" onClick={() => navigate('/student/tests')}>Back to Tests</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/tests')} style={{ marginBottom: 16 }}>
        <FiArrowLeft /> Back
      </button>
      <h1 style={{ marginBottom: 24 }}>{test.title}</h1>

      {test.questions.map((q, qi) => (
        <div key={q.id} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">Question {qi + 1}</div>
          <p style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}>{q.text}</p>

          {/* MCQ, find_bug, choose_code */}
          {(q.question_type === 'mcq' || q.question_type === 'find_bug' || q.question_type === 'choose_code') && Array.isArray(q.options) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, oi) => (
                <label key={oi} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--border)'}`,
                  background: answers[q.id] === opt ? '#EEF2FF' : 'white',
                }}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswer(q.id, opt)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${answers[q.id] === opt ? 'var(--primary)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {answers[q.id] === opt && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </div>
                  <span style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Matching */}
          {q.question_type === 'matching' && q.options && (
            <MatchingQuestion question={q} answer={answers[q.id] || {}} onChange={val => setAnswer(q.id, val)} />
          )}
        </div>
      ))}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ marginTop: 16 }}>
        {submitting ? 'Submitting...' : 'Submit Test'}
      </button>
    </div>
  );
}

function MatchingQuestion({ question, answer, onChange }) {
  const left = question.options.left || [];
  const right = question.options.right || [];

  function handleSelect(leftItem, rightItem) {
    onChange({ ...answer, [leftItem]: rightItem });
  }

  return (
    <div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>Match each item on the left with the correct item on the right</p>
      {left.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ minWidth: 120, fontWeight: 600, fontSize: '0.85rem' }}>{l}</span>
          <select
            className="form-input"
            value={answer[l] || ''}
            onChange={e => handleSelect(l, e.target.value)}
            style={{ maxWidth: 250 }}
          >
            <option value="">Select...</option>
            {right.map((r, ri) => <option key={ri} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
