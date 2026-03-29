import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../hooks/useAPI.js';
import { useAuth } from '../hooks/useAuth.jsx';

const LEVEL = (xp) => Math.floor(Math.sqrt((xp || 0) / 100)) + 1;
const XP_FOR_LEVEL = (l) => (l - 1) * (l - 1) * 100;
const RARITY = { common: '#aaa', rare: 'var(--blue)', epic: '#b388ff', legendary: 'var(--yellow)' };

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.userProfile(username).then(setData).catch(e => { setError(e.message); }).finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!data) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>{error || 'User not found'}</div>;

  const { user, progress = [], achievements = [], recentSubmissions = [] } = data;
  const level = LEVEL(user.xp);
  const levelXP = XP_FOR_LEVEL(level);
  const nextXP = XP_FOR_LEVEL(level + 1);
  const pct = Math.min(100, ((user.xp - levelXP) / (nextXP - levelXP)) * 100);
  const solved = progress.filter(p => p.status === 'solved').length;
  const isMe = me && me.username === user.username;

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Profile sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #5d9af5, var(--green))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: '#fff'
            }}>{user.username?.[0]?.toUpperCase()}</div>

            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{user.username}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              {user.title || 'Shader Noob'}
              {isMe && <span style={{ marginLeft: 8, color: 'var(--green)' }}>· you</span>}
            </div>

            {/* Level + progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Level {level}</span>
                <span style={{ color: 'var(--text-muted)' }}>{(user.xp || 0).toLocaleString()} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                {nextXP.toLocaleString()} XP to Lv.{level + 1}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 0 }}>
              {[
                { n: solved, l: 'Solved' },
                { n: achievements.length, l: 'Badges' },
                { n: user.streak || 0, l: 'Streak' },
                { n: recentSubmissions.length + '+', l: 'Submissions' },
              ].map(s => (
                <div key={s.l} style={{ background: 'var(--bg-base)', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Joined */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Joined {new Date(user.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Achievements */}
          <div className="card">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
              Achievements <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({achievements.length})</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {achievements.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No achievements yet. Start solving!</p>
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {achievements.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', background: 'var(--bg-base)',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        borderLeft: `3px solid ${RARITY[a.rarity] || '#aaa'}`,
                      }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: RARITY[a.rarity] || 'var(--text-primary)' }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{a.xp_reward} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Recent activity */}
          <div className="card">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>Recent Submissions</div>
            {recentSubmissions.length === 0
              ? <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-muted)' }}>No submissions yet.</div>
              : recentSubmissions.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderBottom: i < recentSubmissions.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{ fontSize: 13, color: s.status === 'accepted' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                    {s.status === 'accepted' ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 13, flex: 1, color: 'var(--text-secondary)' }}>{s.problem_id}</span>
                  {s.xp_earned > 0 && <span style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600 }}>+{s.xp_earned} XP</span>}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.submitted_at).toLocaleDateString()}</span>
                </div>
              ))
            }
          </div>

          {/* Solved problems */}
          {progress.filter(p => p.status === 'solved').length > 0 && (
            <div className="card">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>
                Solved Problems ({solved})
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {progress.filter(p => p.status === 'solved').map(p => (
                  <span key={p.problem_id} className="tag" style={{ color: 'var(--green)', background: 'rgba(0,184,163,0.08)' }}>
                    {p.problem_id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
