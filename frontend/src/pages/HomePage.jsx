import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../hooks/useAPI.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.dailyChallenge().then(setDaily).catch(() => {});
    api.leaderboard().then(d => setLeaderboard(d.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div className="page">

      {/* Hero — minimal, clean */}
      <div style={{ textAlign: 'center', padding: '48px 0 40px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, letterSpacing: '-0.02em' }}>
          GPU Programming Challenges
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Master CUDA, Metal, SIMD, and hardware architecture through hands-on coding problems.
          Build the skills that ship real ML infrastructure.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/problems')}>Start Solving</button>
          {!user && <Link to="/auth" className="btn btn-ghost btn-lg">Create Account</Link>}
        </div>

        {/* Stats strip */}
        {stats && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 0,
            marginTop: 48, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
          }}>
            {[
              { n: stats.totalProblems, label: 'Problems' },
              { n: stats.totalUsers, label: 'Users' },
              { n: stats.totalSolved, label: 'Accepted' },
            ].map((s, i) => (
              <div key={s.label} style={{
                padding: '20px 40px',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{s.n}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Daily challenge */}
          {daily && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                      Daily Challenge
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{daily.problem?.title}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`diff diff-${daily.problem?.difficulty}`}>{daily.problem?.difficulty}</span>
                  <span style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600 }}>+{daily.problem?.xp} XP</span>
                  <Link to={`/problems/${daily.problem?.slug}`} className="btn btn-sm btn-primary">Solve</Link>
                </div>
              </div>
            </div>
          )}

          {/* Category cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.id} to={`/problems?category=${encodeURIComponent(cat.name)}`}>
                <div className="card" style={{ padding: 16, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{cat.desc}</p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    {cat.tags.map(t => <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Difficulty guide */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Difficulty Tiers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { key: 'novice', label: 'Novice', desc: 'Core concepts, first kernels', xp: '50–75' },
                { key: 'warrior', label: 'Warrior', desc: 'Optimization, architecture', xp: '150–250' },
                { key: 'legend', label: 'Legend', desc: 'Research-level challenges', xp: '300–500' },
              ].map(d => (
                <div key={d.key} style={{ padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <span className={`diff diff-${d.key}`} style={{ marginBottom: 6, display: 'inline-flex' }}>{d.label}</span>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.4 }}>{d.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>{d.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Leaderboard */}
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Top Warriors</span>
              <Link to="/leaderboard" style={{ fontSize: 12, color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--green)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >View all</Link>
            </div>
            {leaderboard.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Be the first on the board!
              </div>
            ) : leaderboard.map((u, i) => (
              <Link key={u.user_id} to={`/profile/${u.username}`}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{
                    width: 20, textAlign: 'center', fontSize: 13,
                    color: i === 0 ? 'var(--yellow)' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'var(--text-muted)',
                    fontWeight: 600, flexShrink: 0
                  }}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                  </span>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, truncate: true }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.solved_count || 0} solved</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>
                    {(u.xp || 0).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Supported tech */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Supported Languages</div>
            {[
              { name: 'CUDA C++', desc: 'NVIDIA GPU kernels' },
              { name: 'Triton (Python)', desc: 'OpenAI Triton compiler' },
              { name: 'Metal MSL', desc: 'Apple GPU shaders' },
              { name: 'OpenCL C', desc: 'Cross-platform compute' },
              { name: 'x86 SIMD / C', desc: 'AVX2, SSE intrinsics' },
            ].map(p => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 'cuda', name: 'CUDA Fundamentals', icon: '⚡', desc: 'Kernels, memory, warps — master NVIDIA GPU programming.', tags: ['kernels','shared-mem','warps'] },
  { id: 'memory', name: 'Memory Architecture', icon: '🏛️', desc: 'Coalescing, bank conflicts, cache — memory is everything.', tags: ['coalescing','L1/L2','bandwidth'] },
  { id: 'parallel', name: 'Parallel Algorithms', icon: '🔱', desc: 'Scan, reduce, sort — classic algorithms at GPU scale.', tags: ['scan','reduce','radix-sort'] },
  { id: 'hw', name: 'Hardware Architecture', icon: '🔧', desc: 'Warp divergence, occupancy, pipeline hazards.', tags: ['SIMT','occupancy','divergence'] },
  { id: 'advanced', name: 'Advanced GPU', icon: '🧠', desc: 'Flash Attention, Triton kernels, custom ops.', tags: ['triton','flash-attn','fusion'] },
  { id: 'simd', name: 'Hardware Fundamentals', icon: '🔬', desc: 'SIMD intrinsics, cache probing, CPU microarchitecture.', tags: ['AVX2','SSE','cache'] },
  { id: 'metal', name: 'Metal / Vulkan', icon: '🍎', desc: 'Apple Silicon, Vulkan compute shaders.', tags: ['Metal','Vulkan','MSL'] },
];
