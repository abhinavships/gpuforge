import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../hooks/useAPI.js';
import { useAuth } from '../hooks/useAuth.jsx';

const LEVEL = (xp) => Math.floor(Math.sqrt((xp || 0) / 100)) + 1;

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard().then(d => { setBoard(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const myRank = user ? board.findIndex(u => u.username === user.username) + 1 : 0;

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Leaderboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Top GPU programmers ranked by XP</p>
      </div>

      {/* User's rank card */}
      {user && myRank > 0 && (
        <div style={{
          marginBottom: 20, padding: '14px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', borderLeft: '3px solid var(--green)',
          display: 'flex', alignItems: 'center', gap: 16
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your rank</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>#{myRank}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>{(user.xp || 0).toLocaleString()} XP</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{LEVEL(user.xp)}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      ) : (
        <div className="card">
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 100px',
            padding: '10px 20px', borderBottom: '1px solid var(--border)',
            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)'
          }}>
            <span>#</span><span>User</span><span style={{ textAlign: 'center' }}>Level</span><span style={{ textAlign: 'center' }}>Solved</span><span style={{ textAlign: 'right' }}>XP</span>
          </div>

          {board.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No rankings yet. <Link to="/problems" style={{ color: 'var(--green)' }}>Start solving!</Link>
            </div>
          )}

          {board.map((entry, i) => {
            const isMe = user && entry.username === user.username;
            return (
              <Link key={entry.user_id} to={`/profile/${entry.username}`}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '48px 1fr 80px 80px 100px',
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                  alignItems: 'center', transition: 'background 0.1s',
                  background: isMe ? 'rgba(0,184,163,0.05)' : 'none',
                  borderLeft: isMe ? '3px solid var(--green)' : '3px solid transparent',
                  marginLeft: isMe ? -3 : 0,
                }}
                onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'none'; }}
                >
                  {/* Rank */}
                  <div style={{ textAlign: 'center' }}>
                    {i < 3
                      ? <span style={{ fontSize: 16 }}>{['🥇','🥈','🥉'][i]}</span>
                      : <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</span>
                    }
                  </div>

                  {/* User */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? 'linear-gradient(135deg,#ffc01e,#ff7c1f)' : i === 1 ? 'linear-gradient(135deg,#aaa,#777)' : i === 2 ? 'linear-gradient(135deg,#cd7f32,#a05a0a)' : 'var(--bg-tag)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: i < 3 ? '#000' : 'var(--text-secondary)',
                    }}>{entry.username?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: isMe ? 'var(--green)' : 'var(--text-primary)' }}>
                        {entry.username} {isMe && <span style={{ fontSize: 11, color: 'var(--green)' }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.title || 'Shader Noob'}</div>
                    </div>
                  </div>

                  {/* Level */}
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {LEVEL(entry.xp)}
                  </div>

                  {/* Solved */}
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {entry.solved_count || 0}
                  </div>

                  {/* XP */}
                  <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: i === 0 ? 'var(--yellow)' : 'var(--text-primary)' }}>
                    {(entry.xp || 0).toLocaleString()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
