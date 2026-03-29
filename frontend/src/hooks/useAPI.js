// API base — injected by Vite at build time, falls back to same-origin /api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() { return localStorage.getItem('gpuforge_token'); }
function setToken(t) { localStorage.setItem('gpuforge_token', t); }
function clearToken() { localStorage.removeItem('gpuforge_token'); }

async function apiFetch(path, options) {
  options = options || {};
  const token = getToken();
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    token ? { Authorization: 'Bearer ' + token } : {},
    options.headers || {}
  );
  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (u, e, p) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ username: u, email: e, password: p }) }),
  login: (u, p) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  getProblems: (filters) => {
    const f = filters || {};
    const q = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([,v]) => v))).toString();
    return apiFetch('/problems' + (q ? '?' + q : ''));
  },
  getProblem: (slug) => apiFetch('/problems/' + slug),
  submit: (slug, code, language) => apiFetch('/problems/' + slug + '/submit', { method: 'POST', body: JSON.stringify({ code, language }) }),
  getDiscussions: (slug) => apiFetch('/problems/' + slug + '/discussions'),
  addDiscussion: (slug, content) => apiFetch('/problems/' + slug + '/discussions', { method: 'POST', body: JSON.stringify({ content }) }),
  leaderboard: () => apiFetch('/leaderboard'),
  dailyChallenge: () => apiFetch('/daily-challenge'),
  stats: () => apiFetch('/stats'),
  achievements: () => apiFetch('/achievements'),
  userProfile: (username) => apiFetch('/user/' + username),
  setToken,
  getToken,
  clearToken
};
