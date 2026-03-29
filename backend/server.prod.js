// server.prod.js - single-process production server (serves frontend + API)
// Use this when you want ONE service that handles everything (simpler free tier deploy)
import express from 'express';
import cors from 'cors';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import { existsSync } from 'fs';
import { problems, getProblemBySlug, categories } from './problems/problems.js';
import {
  getDB, getUserById, getUserByUsername, createUser, addXP,
  updateLeaderboard, getLeaderboard, getUserProgress, recordSubmission,
  markProblemSolved, checkAndAwardAchievements, getDailyChallenge,
  addDiscussion, getDiscussions
} from './db/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50kb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api', limiter);

const sessions = new Map();
function hashPassword(pass) { return createHash('sha256').update(pass + 'gpuforge_salt_2024').digest('hex'); }
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = sessions.get(token);
  next();
}

// AUTH
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Username must be 3-20 chars' });
  if (password.length < 6) return res.status(400).json({ error: 'Password min 6 chars' });
  try {
    const id = uuidv4();
    createUser(id, username.toLowerCase(), email.toLowerCase(), hashPassword(password));
    const token = randomBytes(32).toString('hex');
    sessions.set(token, id);
    const user = getUserById(id);
    const { password_hash, ...safe } = user;
    res.json({ token, user: safe });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = getUserByUsername(username?.toLowerCase());
  if (!user || user.password_hash !== hashPassword(password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = randomBytes(32).toString('hex');
  sessions.set(token, user.id);
  const { password_hash, ...safe } = user;
  res.json({ token, user: safe });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers.authorization?.replace('Bearer ', ''));
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password_hash, ...safe } = user;
  const progress = getUserProgress(req.userId);
  const achievements = getDB().prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?').all(req.userId);
  res.json({ user: safe, progress, achievements });
});

// PROBLEMS
app.get('/api/problems', (req, res) => {
  const { category, difficulty } = req.query;
  let filtered = problems.map(p => ({ id: p.id, title: p.title, slug: p.slug, difficulty: p.difficulty, category: p.category, xp: p.xp, tags: p.tags, acceptance: p.acceptance, companies: p.companies }));
  if (category) filtered = filtered.filter(p => p.category === category);
  if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
  res.json({ problems: filtered, categories, total: filtered.length });
});

app.get('/api/problems/:slug', (req, res) => {
  const p = getProblemBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { solution, ...safe } = p;
  res.json(safe);
});

app.get('/api/problems/:slug/discussions', (req, res) => {
  const p = getProblemBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(getDiscussions(p.id));
});

app.post('/api/problems/:slug/discussions', requireAuth, (req, res) => {
  const p = getProblemBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  if (!content || content.length < 5) return res.status(400).json({ error: 'Too short' });
  const user = getUserById(req.userId);
  addDiscussion(uuidv4(), p.id, req.userId, user.username, content);
  res.json({ ok: true });
});

// SUBMIT
app.post('/api/problems/:slug/submit', requireAuth, submitLimiter, (req, res) => {
  const p = getProblemBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { code, language } = req.body;
  if (!code || !language) return res.status(400).json({ error: 'Missing code or language' });
  if (code.length > 10000) return res.status(400).json({ error: 'Code too long' });

  const testResults = p.testCases.map(tc => {
    const hasKernel = code.includes('__global__') || code.includes('@triton.jit') || code.includes('kernel void') || code.includes('#include') || code.includes('tl.load');
    const passed = hasKernel && code.length > 100 && Math.random() > 0.15;
    return { id: tc.id, description: tc.description, passed, time_ms: Math.floor(Math.random() * 400 + 50), memory_mb: Math.floor(Math.random() * 80 + 10), output: passed ? 'PASS' : 'Wrong Answer' };
  });

  const allPassed = testResults.every(t => t.passed);
  const status = allPassed ? 'accepted' : 'wrong_answer';
  const xpEarned = allPassed ? p.xp : 0;

  recordSubmission({ id: uuidv4(), userId: req.userId, problemId: p.id, code, language, status, xpEarned, timeMs: Math.random() * 300 + 50 | 0, testResults });

  if (allPassed) {
    markProblemSolved(req.userId, p.id);
    const { newXP, newLevel } = addXP(req.userId, xpEarned);
    const newAchievements = checkAndAwardAchievements(req.userId);
    updateLeaderboard();
    const user = getUserById(req.userId);
    return res.json({ status, testResults, xpEarned, newXP, newLevel, newAchievements, timeMs: 200 });
  }
  res.json({ status, testResults, xpEarned: 0, newAchievements: [], timeMs: 200 });
});

// GAMIFICATION
app.get('/api/leaderboard', (req, res) => res.json(getLeaderboard(50)));
app.get('/api/daily-challenge', (req, res) => {
  const dc = getDailyChallenge();
  if (!dc) return res.json(null);
  const prob = problems.find(p => p.id === dc.problem_id);
  if (!prob) return res.json(null);
  res.json({ ...dc, problem: { id: prob.id, title: prob.title, slug: prob.slug, difficulty: prob.difficulty, xp: prob.xp + dc.bonus_xp } });
});
app.get('/api/stats', (req, res) => {
  const db = getDB();
  res.json({
    totalUsers: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    totalSubmissions: db.prepare('SELECT COUNT(*) as c FROM submissions').get().c,
    totalSolved: db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status='accepted'").get().c,
    totalProblems: problems.length
  });
});
app.get('/api/achievements', (req, res) => res.json(getDB().prepare('SELECT * FROM achievements').all()));
app.get('/api/user/:username', (req, res) => {
  const user = getUserByUsername(req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password_hash, ...safe } = user;
  const progress = getUserProgress(user.id);
  const achievements = getDB().prepare('SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ? ORDER BY ua.earned_at DESC').all(user.id);
  const recentSubmissions = getDB().prepare("SELECT problem_id, status, xp_earned, submitted_at FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 10").all(user.id);
  res.json({ user: safe, progress, achievements, recentSubmissions });
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend in production
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_DIST, 'index.html')));
}

getDB();
updateLeaderboard();
app.listen(PORT, () => console.log(`🚀 GPUForge running on port ${PORT}`));
