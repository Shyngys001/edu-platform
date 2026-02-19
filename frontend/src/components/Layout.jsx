import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getAuth } from '../utils/api';

export default function Layout({ requiredRole }) {
  const { token, role } = getAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to={`/${role}`} replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
