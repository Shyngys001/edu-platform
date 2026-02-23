import { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiBook, FiCode, FiFileText,
         FiBarChart2, FiUsers, FiMessageCircle } from 'react-icons/fi';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import LangSwitcher from './LangSwitcher';
import { getAuth } from '../utils/api';
import { useT } from '../utils/i18n';

const studentBottomLinks = [
  { to: '/student',           icon: <FiHome />,         label: 'dashboard', exact: true },
  { to: '/student/lessons',   icon: <FiBook />,         label: 'lessons'               },
  { to: '/student/tests',     icon: <FiFileText />,     label: 'tests'                 },
  { to: '/student/tasks',     icon: <FiCode />,         label: 'codeTasks'             },
  { to: '/student/messenger', icon: <FiMessageCircle />,label: 'messenger'             },
];

const teacherBottomLinks = [
  { to: '/teacher',            icon: <FiHome />,         label: 'dashboard', exact: true },
  { to: '/teacher/students',   icon: <FiUsers />,        label: 'students'               },
  { to: '/teacher/lessons',    icon: <FiBook />,         label: 'lessons'                },
  { to: '/teacher/tests',      icon: <FiFileText />,     label: 'tests'                  },
  { to: '/teacher/analytics',  icon: <FiBarChart2 />,    label: 'analytics'              },
];

export default function Layout({ requiredRole }) {
  const { token, role } = getAuth();
  const t = useT();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to={`/${role}`} replace />;

  const bottomLinks = role === 'teacher' ? teacherBottomLinks : studentBottomLinks;

  return (
    <div className="app-layout">
      {/* ── Mobile Topbar ── */}
      <header className="topbar">
        <button
          className="topbar-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FiMenu size={20} />
        </button>
        <div className="topbar-logo">🐍 PyStart</div>
        <div className="topbar-actions">
          <ThemeToggle />
          <LangSwitcher />
        </div>
      </header>

      {/* ── Sidebar Drawer Overlay ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <button
          className="sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
        <Sidebar />
      </div>

      {/* ── Main Area ── */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav" aria-label="Bottom navigation">
        {bottomLinks.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            {l.icon}
            <span>{t(l.label)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
