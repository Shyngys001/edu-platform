import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAuth } from '../../utils/api';
import { useT } from '../../utils/i18n';
import LangSwitcher from '../../components/LangSwitcher';
import toast from 'react-hot-toast';

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
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🐍</div>
          <span className="auth-logo-text">PyStart</span>
        </div>
        <div className="auth-kz-badge">🇰🇿 Made in Kazakhstan</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1>{t('createAccount')}</h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>{t('registerSubtitle')}</p>
          </div>
          <LangSwitcher />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('fullName')}</label>
            <input className="form-input" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('username')}</label>
            <input className="form-input" value={form.username} onChange={e => update('username', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={4} />
          </div>
          <div className="form-group">
            <label>{t('gradeClass')}</label>
            <input className="form-input" value={form.grade} onChange={e => update('grade', e.target.value)} placeholder="e.g. 10A" />
          </div>
          <div className="form-group">
            <label>{t('role')}</label>
            <select className="form-input" value={form.role} onChange={e => update('role', e.target.value)}>
              <option value="student">{t('student')}</option>
              <option value="teacher">{t('teacher')}</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? t('creating') : t('createAccount')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {t('haveAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
