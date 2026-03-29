import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useAuth.jsx';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/problems'); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { addToast('Fill in all fields', 'error'); return; }
    if (mode === 'register' && !email) { addToast('Email is required', 'error'); return; }
    setLoading(true);
    try {
      if (mode === 'login') { await login(username, password); addToast('Welcome back!', 'success'); }
      else { await register(username, email, password); addToast('Account created!', 'success'); }
      navigate('/problems');
    } catch(e) { addToast(e.message || 'Authentication failed', 'error'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="var(--green)" opacity="0.9"/>
              <text x="12" y="16" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">G</text>
            </svg>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>GPUForge</span>
          </Link>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            {[{ id: 'login', l: 'Sign In' }, { id: 'register', l: 'Register' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                flex: 1, padding: '8px 0',
                fontSize: 14, fontWeight: 600,
                color: mode === m.id ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${mode === m.id ? 'var(--green)' : 'transparent'}`,
                marginBottom: -1, transition: 'all 0.15s'
              }}>{m.l}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="your_handle" maxLength={20} required autoFocus />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" minLength={6} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />&nbsp;Please wait…</>
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            No email verification required. Register with any username (3–20 chars) and a password (6+ chars).
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
