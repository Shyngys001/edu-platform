import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../../utils/api';
import { useT } from '../../utils/i18n';
import LangSwitcher from '../../components/LangSwitcher';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🐍</div>
          <span className="auth-logo-text">PyStart</span>
        </div>
        <div className="auth-kz-badge">🇰🇿 Made in Kazakhstan</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1>{t('welcomeBack')}</h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>{t('signInSubtitle')}</p>
          </div>
          <LangSwitcher />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {t('noAccount')} <Link to="/register">{t('register')}</Link>
        </p>
      </div>
    </div>
  );
}
