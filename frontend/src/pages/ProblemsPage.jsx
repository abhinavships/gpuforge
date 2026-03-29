import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../hooks/useAPI.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ProblemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [search, setSearch] = useState('');

  const selCategory = searchParams.get('category') || '';
  const selDifficulty = searchParams.get('difficulty') || '';

  useEffect(() => {
    setLoading(true);
    const f = {};
    if (selCategory) f.category = selCategory;
    if (selDifficulty) f.difficulty = selDifficulty;
    api.getProblems(f).then(d => { setProblems(d.problems); setCategories(d.categories); setLoading(false); }).catch(() => setLoading(false));
  }, [selCategory, selDifficulty]);

  useEffect(() => {
    if (user) {
      api.me().then(d => {
        const map = {};
        (d.progress || []).forEach(p => { map[p.problem_id] = p.status; });
        setProgress(map);
      }).catch(() => {});
    }
  }, [user]);

  const filtered = problems.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.includes(search.toLowerCase()))
  );

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    setSearchParams(p);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)' }}>

      {/* Sidebar */}
      <div style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        padding: '16px 0', overflowY: 'auto',
        background: 'var(--bg-nav)'
      }}>
        {/* Search */}
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <input
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 13, padding: '7px 10px' }}
          />
        </div>

        {/* Difficulty */}
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Difficulty</div>
          {[{ v: '', l: 'All' }, { v: 'novice', l: 'Novice' }, { v: 'warrior', l: 'Warrior' }, { v: 'legend', l: 'Legend' }].map(d => (
            <button key={d.v} onClick={() => setFilter('difficulty', d.v)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px 10px', marginBottom: 2, borderRadius: 'var(--radius-sm)',
              background: selDifficulty === d.v ? 'var(--bg-hover)' : 'none',
              border: 'none',
              fontSize: 13,
              color: selDifficulty === d.v ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (selDifficulty !== d.v) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (selDifficulty !== d.v) e.currentTarget.style.background = 'none'; }}
            >{d.l}</button>
          ))}
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 12px' }} />

        {/* Categories */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Category</div>
          <button onClick={() => setFilter('category', '')} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '6px 10px', marginBottom: 2, borderRadius: 'var(--radius-sm)',
            background: !selCategory ? 'var(--bg-hover)' : 'none', border: 'none',
            fontSize: 13, color: !selCategory ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.1s',
          }}>All Topics</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter('category', cat)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px 10px', marginBottom: 2, borderRadius: 'var(--radius-sm)',
              background: selCategory === cat ? 'var(--bg-hover)' : 'none', border: 'none',
              fontSize: 13, color: selCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (selCategory !== cat) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (selCategory !== cat) e.currentTarget.style.background = 'none'; }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Problem list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--bg-base)', zIndex: 10
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {filtered.length} problem{filtered.length !== 1 ? 's' : ''}
            {(selCategory || selDifficulty) && (
              <button onClick={() => setSearchParams({})} style={{
                marginLeft: 10, fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer'
              }}>✕ Clear filters</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)', fontSize: 14 }}>
            No problems found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '8px 20px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', width: 36 }}></th>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Title</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', width: 140 }}>Category</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', width: 90 }}>Difficulty</th>
                <th style={{ padding: '8px 16px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', width: 60 }}>XP</th>
                <th style={{ padding: '8px 20px 8px 16px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', width: 80 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = progress[p.id];
                const solved = status === 'solved';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {/* Status */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      {solved ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="7" fill="var(--green)" opacity="0.15"/>
                          <path d="M4 7l2 2 4-4" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : <span style={{ width: 14, display: 'inline-block' }}/>}
                    </td>

                    {/* Title */}
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/problems/${p.slug}`} style={{ fontSize: 14, fontWeight: 500, color: solved ? 'var(--text-muted)' : 'var(--text-primary)', display: 'block', marginBottom: 4 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--green)'}
                        onMouseLeave={e => e.currentTarget.style.color = solved ? 'var(--text-muted)' : 'var(--text-primary)'}
                      >{p.title}</Link>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(p.tags || []).slice(0, 3).map(t => <span key={t} className="tag" style={{ fontSize: 10 }}>{t}</span>)}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {p.category}
                    </td>

                    {/* Difficulty */}
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`diff diff-${p.difficulty}`}>{p.difficulty}</span>
                    </td>

                    {/* XP */}
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>
                      {p.xp}
                    </td>

                    {/* Acceptance */}
                    <td style={{ padding: '14px 20px 14px 16px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12,
                        color: p.acceptance > 50 ? 'var(--green)' : p.acceptance > 30 ? 'var(--yellow)' : 'var(--red)'
                      }}>
                        {p.acceptance}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
