import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../../utils/api';
import { useT } from '../../utils/i18n';
import LangSwitcher from '../../components/LangSwitcher';
import ThemeToggle from '../../components/ThemeToggle';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiTag, FiArrowRight } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', full_name: '', grade: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form);
      setAuth(data);
      toast.success(`${t('welcome')}!`);
      navigate(data.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left Branding Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-left-logo-icon">🐍</div>
            <span className="auth-left-logo-text">PyStart</span>
          </div>

          <h2>Start Your Python Journey Today.</h2>
          <p>
            Create your account and get instant access to interactive lessons,
            practice tests, and a real coding environment — all for free.
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">⚡</div>
              <span>Get started in under 2 minutes</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🎯</div>
              <span>Personalized curriculum for your grade</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">💬</div>
              <span>Chat with classmates and your teacher</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📈</div>
              <span>Track your progress with detailed analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-logo" style={{ display: 'none' }}>
            <div className="auth-logo-icon"
              style={{ width: 40, height: 40, background: 'var(--brand-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              🐍
            </div>
            <span className="auth-logo-text" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand)' }}>PyStart</span>
          </div>

          <div className="auth-card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <h1>{t('createAccount')}</h1>
                <p className="subtitle">{t('registerSubtitle')}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <ThemeToggle />
                <LangSwitcher />
              </div>
            </div>
            <div className="auth-kz-badge" style={{ marginTop: 8 }}>🇰🇿 Made in Kazakhstan</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('fullName')}</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '1rem' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="Aibek Dzhaksybekov"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('username')}</label>
              <div style={{ position: 'relative' }}>
                <FiTag style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '1rem' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  value={form.username}
                  onChange={e => update('username', e.target.value)}
                  placeholder="your_username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '1rem' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  type="password"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={4}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t('gradeClass')}</label>
                <input
                  className="form-input"
                  value={form.grade}
                  onChange={e => update('grade', e.target.value)}
                  placeholder="e.g. 10A"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t('role')}</label>
                <select className="form-input" value={form.role} onChange={e => update('role', e.target.value)}>
                  <option value="student">{t('student')}</option>
                  <option value="teacher">{t('teacher')}</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 20, justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? t('creating') : t('createAccount')}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-2)' }}>
            {t('haveAccount')}{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
