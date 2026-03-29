import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const XP_TO_LEVEL = (xp) => Math.floor(Math.sqrt((xp || 0) / 100)) + 1;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = (path) => location.pathname.startsWith(path);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg-nav)',
      borderBottom: '1px solid var(--border)',
      height: 48,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 0 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="var(--green)" opacity="0.9"/>
            <text x="12" y="16" textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold">G</text>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>GPUForge</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: 48, gap: 0 }}>
          {[
            { to: '/problems', label: 'Problems' },
            { to: '/leaderboard', label: 'Leaderboard' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{
              display: 'flex', alignItems: 'center',
              padding: '0 14px',
              fontSize: 13,
              fontWeight: 500,
              color: active(l.to) ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: active(l.to) ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => { if (!active(l.to)) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >{l.label}</Link>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right */}
        {user ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setOpen(!open)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {/* Avatar circle */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #5d9af5, var(--green))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{user.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>
                  Lv.{XP_TO_LEVEL(user.xp)} · {(user.xp || 0).toLocaleString()} XP
                </div>
              </div>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--text-muted)">
                <path d="M2 4l4 4 4-4" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </button>

            {open && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 4px)',
                background: 'var(--bg-card)', border: '1px solid var(--border-md)',
                borderRadius: 'var(--radius)', minWidth: 160, zIndex: 200,
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                <Link to={`/profile/${user.username}`} onClick={() => setOpen(false)} style={{
                  display: 'block', padding: '10px 14px', fontSize: 13,
                  color: 'var(--text-secondary)', transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >My Profile</Link>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <button onClick={async () => { setOpen(false); await logout(); navigate('/'); }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', fontSize: 13, background: 'none', border: 'none',
                  color: 'var(--text-muted)', transition: 'background 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/auth" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/auth?mode=register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
