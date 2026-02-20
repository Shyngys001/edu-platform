import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import Sidebar from './Sidebar';
import { getAuth } from '../utils/api';

export default function Layout({ requiredRole }) {
  const { token, role } = getAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to={`/${role}`} replace />;

  return (
    <div className="app-layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open menu"
      >
        <FiMenu size={24} />
      </button>
      <div className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`sidebar-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
          <FiX size={24} />
        </button>
        <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </div>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
