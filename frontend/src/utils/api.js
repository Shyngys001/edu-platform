// Same-origin when frontend served from backend; VITE_API_URL for separate deploy; localhost for dev
const _apiUrl = import.meta.env.VITE_API_URL || '';
const _origin = typeof window !== 'undefined' ? window.location.origin : '';
const _sameOrigin = _origin && !_origin.includes('5173') ? _origin : '';
const API_URL = _apiUrl || _sameOrigin || 'http://localhost:8000';
const BASE = `${API_URL}/api`;
export const STATIC_BASE = API_URL;

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    // Only redirect to login on 401 for non-auth endpoints
    if (res.status === 401 && !path.startsWith('/auth/')) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    throw new Error(err.detail || 'Request failed');
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  getBlob: async (path) => {
    const token = getToken();
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.blob();
  },
  uploadFile: async (path, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
};

export function setAuth(data) {
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('userId', data.user_id);
  localStorage.setItem('fullName', data.full_name);
}

export function getAuth() {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    userId: localStorage.getItem('userId'),
    fullName: localStorage.getItem('fullName'),
  };
}

export function logout() {
  localStorage.clear();
  window.location.href = '/login';
}
