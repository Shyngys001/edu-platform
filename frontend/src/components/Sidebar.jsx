import { NavLink } from 'react-router-dom';
import { getAuth, logout } from '../utils/api';
import { useT } from '../utils/i18n';
import LangSwitcher from './LangSwitcher';
import ThemeToggle from './ThemeToggle';
import {
  FiHome, FiBook, FiCode, FiFileText, FiAward,
  FiMessageSquare, FiBarChart2, FiUsers,
  FiLogOut, FiInbox, FiDownload, FiMessageCircle,
  FiLayers, FiList,
} from 'react-icons/fi';

export default function Sidebar({ onNavClick }) {
  const { role, fullName } = getAuth();
  const t = useT();

  const studentLinks = [
    { to: '/student', icon: <FiHome />, label: t('dashboard') },
    { to: '/student/lessons', icon: <FiBook />, label: t('lessons') },
    { to: '/student/tests', icon: <FiFileText />, label: t('tests') },
    { to: '/student/tasks', icon: <FiCode />, label: t('codeTasks') },
    { to: '/student/leaderboard', icon: <FiAward />, label: t('leaderboard') },
    { to: '/student/chat', icon: <FiMessageSquare />, label: t('aiHelper') },
    { to: '/student/stats', icon: <FiBarChart2 />, label: t('statistics') },
    { to: '/student/inbox', icon: <FiInbox />, label: t('inbox') },
    { to: '/student/messenger', icon: <FiMessageCircle />, label: t('messenger') },
    { to: '/student/grades', icon: <FiLayers />, label: t('gradeProgress') },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: <FiHome />, label: t('dashboard') },
    { to: '/teacher/students', icon: <FiUsers />, label: t('students') },
    { to: '/teacher/lessons', icon: <FiBook />, label: t('lessons') },
    { to: '/teacher/tests', icon: <FiFileText />, label: t('tests') },
    { to: '/teacher/tasks', icon: <FiCode />, label: t('codeTasks') },
    { to: '/teacher/analytics', icon: <FiBarChart2 />, label: t('analytics') },
    { to: '/teacher/feedback', icon: <FiMessageSquare />, label: t('feedback') },
    { to: '/teacher/export', icon: <FiDownload />, label: t('export') },
    { to: '/teacher/messenger', icon: <FiMessageCircle />, label: t('messenger') },
    { to: '/teacher/topics', icon: <FiList />, label: t('topics') },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🐍</span>
        {t('appName')}
      </div>
      <div className="sidebar-tagline">{t('appTagline')}</div>
      <div className="sidebar-role">{fullName} ({t(role)})</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <LangSwitcher />
        <ThemeToggle />
      </div>

      <div className="sidebar-badge-kz">
        🇰🇿 {t('madeInKZ')}
      </div>

      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/student' || l.to === '/teacher'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onNavClick}
          >
            {l.icon}
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={() => { logout(); onNavClick?.(); }} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
          <FiLogOut />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
