import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../hooks/useAPI.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useAuth.jsx';

const LANGS = [
  { value: 'cuda', label: 'CUDA C++' },
  { value: 'opencl', label: 'OpenCL C' },
  { value: 'triton', label: 'Triton (Python)' },
  { value: 'metal', label: 'Metal MSL' },
  { value: 'cpp', label: 'C++ (CPU)' },
  { value: 'c', label: 'C' },
];

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('problem');
  const [lang, setLang] = useState('cuda');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [comment, setComment] = useState('');
  const [revealedHints, setRevealedHints] = useState([]);
  const [MonacoComp, setMonacoComp] = useState(null);

  useEffect(() => {
    api.getProblem(slug)
      .then(p => { setProblem(p); setCode(p.starterCode?.cuda || ''); setLoading(false); })
      .catch(() => setLoading(false));
    import('@monaco-editor/react').then(m => setMonacoComp(() => m.default)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (tab === 'discussion') api.getDiscussions(slug).then(setDiscussions).catch(() => {});
  }, [tab, slug]);

  const handleLangChange = (l) => {
    setLang(l);
    if (problem?.starterCode) setCode(problem.starterCode[l] || problem.starterCode.cuda || '');
  };

  const handleSubmit = async () => {
    if (!user) { addToast('Sign in to submit', 'error'); navigate('/auth'); return; }
    if (!code.trim()) { addToast('Write some code first', 'error'); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.submit(slug, code, lang);
      setResult(res);
      if (res.status === 'accepted') {
        addToast(`Accepted! +${res.xpEarned} XP`, 'success');
        res.newAchievements?.forEach((a, i) => setTimeout(() => addToast(`🏆 ${a.name} unlocked! +${a.xp_reward} XP`, 'achievement', 6000), (i + 1) * 1200));
      } else {
        addToast('Wrong answer — check the test cases below', 'error');
      }
    } catch(e) { addToast(e.message || 'Submission failed', 'error'); }
    setSubmitting(false);
  };

  const postComment = async () => {
    if (!user) { addToast('Sign in to comment', 'error'); return; }
    if (comment.trim().length < 5) { addToast('Comment too short', 'error'); return; }
    try {
      await api.addDiscussion(slug, comment);
      setComment('');
      const d = await api.getDiscussions(slug);
      setDiscussions(d);
      addToast('Comment posted', 'success');
    } catch(e) { addToast(e.message, 'error'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}><div className="spinner" /></div>;
  if (!problem) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Problem not found. <Link to="/problems">← Back</Link></div>;

  const monacoLang = ['cuda','opencl','metal','cpp','c'].includes(lang) ? 'cpp' : 'python';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>

      {/* ---- Left panel ---- */}
      <div style={{ width: '50%', minWidth: 360, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Problem header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Link to="/problems" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >Problems</Link>
            {' / '}{problem.category}
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, letterSpacing: '-0.01em' }}>{problem.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`diff diff-${problem.difficulty}`}>{problem.difficulty}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>{problem.acceptance}%</span> acceptance
            </span>
            <span style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 600 }}>+{problem.xp} XP</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {(problem.companies || []).map(c => <span key={c} className="tag" style={{ fontSize: 10 }}>{c}</span>)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 20px' }}>
          {[
            { id: 'problem', label: 'Description' },
            { id: 'hints', label: `Hints (${problem.hints?.length || 0})` },
            { id: 'discussion', label: 'Discussion' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 0', marginRight: 20, fontSize: 13, fontWeight: 500,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'all 0.15s', cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {tab === 'problem' && <>
            <div className="markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description || ''}</ReactMarkdown>
            </div>

            {(problem.examples || []).length > 0 && (
              <div style={{ marginTop: 20 }}>
                {problem.examples.map((ex, i) => (
                  <div key={i} style={{ marginBottom: 12, background: 'var(--bg-nav)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Example {i + 1}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>Input: </span>{ex.input}</div>
                      <div><span style={{ color: 'var(--text-muted)' }}>Output: </span><span style={{ color: 'var(--green)' }}>{ex.output}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {problem.conceptExplanation && (
              <div style={{ marginTop: 20, background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Concept</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{problem.conceptExplanation}</p>
              </div>
            )}

            {problem.starterCode?.cpu_reference && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>CPU Reference (Beat This)</div>
                <pre style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, overflowX: 'auto', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#ccc' }}>
                  {problem.starterCode.cpu_reference}
                </pre>
              </div>
            )}
          </>}

          {tab === 'hints' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Revealing hints doesn't cost XP.</p>
              {(problem.hints || []).map((h, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  {revealedHints.includes(i) ? (
                    <div style={{ background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 6 }}>Hint {i + 1}</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{h}</p>
                    </div>
                  ) : (
                    <button onClick={() => setRevealedHints(prev => [...prev, i])} style={{
                      width: '100%', textAlign: 'left', padding: '12px 14px',
                      background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                      fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', transition: 'border-color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >🔒 Show Hint {i + 1}</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'discussion' && (
            <div>
              {user ? (
                <div style={{ marginBottom: 20 }}>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Share your approach or ask a question..."
                    rows={3} style={{ resize: 'vertical', marginBottom: 8, fontSize: 13 }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={postComment}>Post</button>
                </div>
              ) : (
                <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  <Link to="/auth" style={{ color: 'var(--green)' }}>Sign in</Link> to join the discussion
                </div>
              )}
              {discussions.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
                : discussions.map(d => (
                  <div key={d.id} style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Link to={`/profile/${d.username}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{d.username}</Link>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{d.content}</p>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* ---- Right panel: Editor + Output ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Editor toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-nav)', flexShrink: 0,
        }}>
          <select value={lang} onChange={e => handleLangChange(e.target.value)} style={{ width: 150, padding: '5px 8px', fontSize: 12 }}>
            {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={() => problem?.starterCode && setCode(problem.starterCode[lang] || problem.starterCode.cuda || '')}>Reset</button>
          <button className={`btn btn-sm btn-submit`} onClick={handleSubmit} disabled={submitting} style={{ minWidth: 100, justifyContent: 'center' }}>
            {submitting ? <><span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Running</> : '▶ Submit'}
          </button>
        </div>

        {/* Monaco / textarea */}
        <div style={{ flex: result ? '1 1 60%' : '1 1 100%', minHeight: 0, position: 'relative' }}>
          {MonacoComp ? (
            <MonacoComp height="100%" language={monacoLang} value={code} onChange={v => setCode(v || '')} theme="vs-dark"
              options={{ fontSize: 13, fontFamily: 'var(--font-mono)', minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, tabSize: 4, lineNumbers: 'on', renderLineHighlight: 'line', wordWrap: 'off' }}
            />
          ) : (
            <textarea value={code} onChange={e => setCode(e.target.value)} style={{
              width: '100%', height: '100%', background: '#1e1e1e', color: '#d4d4d4', border: 'none',
              padding: 16, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6, resize: 'none', outline: 'none', tabSize: 4,
            }} spellCheck={false}
              onKeyDown={e => {
                if (e.key === 'Tab') { e.preventDefault(); const s = e.target.selectionStart; const n = code.substring(0, s) + '    ' + code.substring(e.target.selectionEnd); setCode(n); setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0); }
              }}
            />
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', overflowY: 'auto', maxHeight: '40%', background: 'var(--bg-nav)' }}>
            {/* Status bar */}
            <div style={{
              padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: '1px solid var(--border)',
              background: result.status === 'accepted' ? 'rgba(0,184,163,0.06)' : 'rgba(239,71,67,0.06)'
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: result.status === 'accepted' ? 'var(--green)' : 'var(--red)' }}>
                {result.status === 'accepted' ? '✓ Accepted' : '✗ Wrong Answer'}
              </span>
              {result.xpEarned > 0 && <span style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 600 }}>+{result.xpEarned} XP</span>}
              {result.newXP != null && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: {result.newXP?.toLocaleString()} XP · Lv.{result.newLevel}</span>}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{result.timeMs}ms</span>
            </div>

            {/* Test cases */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Test Cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(result.testResults || []).map(tc => (
                  <div key={tc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    background: tc.passed ? 'rgba(0,184,163,0.06)' : 'rgba(239,71,67,0.06)',
                    border: `1px solid ${tc.passed ? 'rgba(0,184,163,0.2)' : 'rgba(239,71,67,0.2)'}`,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      {tc.passed ? (
                        <><circle cx="7" cy="7" r="7" fill="var(--green)" opacity="0.15"/><path d="M4 7l2 2 4-4" stroke="var(--green)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>
                      ) : (
                        <><circle cx="7" cy="7" r="7" fill="var(--red)" opacity="0.15"/><path d="M5 5l4 4M9 5l-4 4" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/></>
                      )}
                    </svg>
                    <span style={{ fontSize: 13, flex: 1, color: 'var(--text-secondary)' }}>{tc.description}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tc.time_ms}ms</span>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              {result.newAchievements?.length > 0 && (
                <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,192,30,0.06)', border: '1px solid rgba(255,192,30,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--yellow)', marginBottom: 8 }}>Achievements Unlocked</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {result.newAchievements.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span>{a.icon}</span>
                        <span style={{ fontWeight: 500 }}>{a.name}</span>
                        <span style={{ color: 'var(--yellow)' }}>+{a.xp_reward} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
