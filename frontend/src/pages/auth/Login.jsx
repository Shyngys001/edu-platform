import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../../utils/api';
import { useT } from '../../utils/i18n';
import LangSwitcher from '../../components/LangSwitcher';
import ThemeToggle from '../../components/ThemeToggle';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const t = useT();

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });
      setAuth(data);
      toast.success(`${t('welcome')}, ${data.full_name}!`);
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

          <h2>Learn Python.<br />Build Your Future.</h2>
          <p>
            An interactive platform for students in Kazakhstan to master
            programming through guided lessons, live coding challenges, and AI assistance.
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📚</div>
              <span>Structured Python curriculum for grades 6–11</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🤖</div>
              <span>AI-powered coding assistant</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🏆</div>
              <span>Leaderboard & achievement badges</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🇰🇿</div>
              <span>Made in Kazakhstan, supports KZ / RU / EN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile logo (hidden on desktop via CSS) */}
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
                <h1>{t('welcomeBack')}</h1>
                <p className="subtitle">{t('signInSubtitle')}</p>
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
              <label>{t('username')}</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '1rem' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              {loading ? t('signingIn') : t('signIn')}
              {!loading && <FiArrowRight />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-2)' }}>
            {t('noAccount')}{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>{t('register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
