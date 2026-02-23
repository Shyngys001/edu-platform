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

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Sidebar() {
  const { role, fullName } = getAuth();
  const t = useT();

  const studentLinks = [
    { to: '/student',            icon: <FiHome />,         label: t('dashboard'),     exact: true },
    { to: '/student/lessons',    icon: <FiBook />,         label: t('lessons')                    },
    { to: '/student/tests',      icon: <FiFileText />,     label: t('tests')                      },
    { to: '/student/tasks',      icon: <FiCode />,         label: t('codeTasks')                  },
    { to: '/student/leaderboard',icon: <FiAward />,        label: t('leaderboard')                },
    { to: '/student/chat',       icon: <FiMessageSquare />,label: t('aiHelper')                   },
    { to: '/student/stats',      icon: <FiBarChart2 />,    label: t('statistics')                 },
    { to: '/student/inbox',      icon: <FiInbox />,        label: t('inbox')                      },
    { to: '/student/messenger',  icon: <FiMessageCircle />,label: t('messenger')                  },
    { to: '/student/grades',     icon: <FiLayers />,       label: t('gradeProgress')              },
  ];

  const teacherLinks = [
    { to: '/teacher',            icon: <FiHome />,         label: t('dashboard'),     exact: true },
    { to: '/teacher/students',   icon: <FiUsers />,        label: t('students')                   },
    { to: '/teacher/lessons',    icon: <FiBook />,         label: t('lessons')                    },
    { to: '/teacher/tests',      icon: <FiFileText />,     label: t('tests')                      },
    { to: '/teacher/tasks',      icon: <FiCode />,         label: t('codeTasks')                  },
    { to: '/teacher/analytics',  icon: <FiBarChart2 />,    label: t('analytics')                  },
    { to: '/teacher/feedback',   icon: <FiMessageSquare />,label: t('feedback')                   },
    { to: '/teacher/export',     icon: <FiDownload />,     label: t('export')                     },
    { to: '/teacher/messenger',  icon: <FiMessageCircle />,label: t('messenger')                  },
    { to: '/teacher/topics',     icon: <FiList />,         label: t('topics')                     },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🐍</div>
          <span className="sidebar-logo-text">{t('appName')}</span>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials(fullName)}</div>
          <div>
            <div className="sidebar-user-name">{fullName}</div>
            <div className="sidebar-user-role">{t(role)}</div>
          </div>
        </div>

        <div className="sidebar-controls">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-badge-kz">🇰🇿 {t('madeInKZ')}</div>
        <button
          className="sidebar-link"
          onClick={() => logout()}
          style={{ width: '100%', color: '#F87171' }}
        >
          <span className="sidebar-link-icon"><FiLogOut /></span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
