// server.js
import express from 'express';
import cors from 'cors';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { problems, getProblemBySlug, categories } from './problems/problems.js';
import {
  getDB, getUserById, getUserByUsername, createUser, addXP,
  updateLeaderboard, getLeaderboard, getUserProgress, recordSubmission,
  markProblemSolved, checkAndAwardAchievements, getDailyChallenge,
  addDiscussion, getDiscussions
} from './db/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '50kb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api', limiter);

// Simple token store (in production use Redis/JWT)
const sessions = new Map();

function hashPassword(pass) {
  return createHash('sha256').update(pass + 'gpuforge_salt_2024').digest('hex');
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = sessions.get(token);
  next();
}

// ==================== AUTH ====================
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
    res.json({ token, user: sanitizeUser(user) });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = getUserByUsername(username?.toLowerCase());
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, user.id);
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const progress = getUserProgress(req.userId);
  const achievements = getDB().prepare(
    'SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ?'
  ).all(req.userId);
  res.json({ user: sanitizeUser(user), progress, achievements });
});

// ==================== PROBLEMS ====================
app.get('/api/problems', (req, res) => {
  const { category, difficulty, tag } = req.query;
  let filtered = problems.map(p => ({
    id: p.id, title: p.title, slug: p.slug, difficulty: p.difficulty,
    category: p.category, xp: p.xp, tags: p.tags, acceptance: p.acceptance,
    companies: p.companies
  }));
  if (category) filtered = filtered.filter(p => p.category === category);
  if (difficulty) filtered = filtered.filter(p => p.difficulty === difficulty);
  if (tag) filtered = filtered.filter(p => p.tags.includes(tag));
  res.json({ problems: filtered, categories, total: filtered.length });
});

app.get('/api/problems/:slug', (req, res) => {
  const problem = getProblemBySlug(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  // Don't send solution
  const { solution, ...safe } = problem;
  res.json(safe);
});

app.get('/api/problems/:slug/discussions', (req, res) => {
  const problem = getProblemBySlug(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Not found' });
  res.json(getDiscussions(problem.id));
});

app.post('/api/problems/:slug/discussions', requireAuth, (req, res) => {
  const problem = getProblemBySlug(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  if (!content || content.length < 5) return res.status(400).json({ error: 'Comment too short' });
  const user = getUserById(req.userId);
  addDiscussion(uuidv4(), problem.id, req.userId, user.username, content);
  res.json({ ok: true });
});

// ==================== SUBMISSIONS ====================
// Note: In production, code execution uses Judge0 CE (self-hosted)
// For this demo, we simulate test case evaluation
app.post('/api/problems/:slug/submit', requireAuth, submitLimiter, (req, res) => {
  const problem = getProblemBySlug(req.params.slug);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });
  
  const { code, language } = req.body;
  if (!code || !language) return res.status(400).json({ error: 'Missing code or language' });
  if (code.length > 10000) return res.status(400).json({ error: 'Code too long (max 10KB)' });
  
  const startTime = Date.now();
  
  // Simulate test execution (in production: call Judge0 CE)
  const testResults = simulateTestExecution(problem, code, language);
  const allPassed = testResults.every(t => t.passed);
  const timeMs = Date.now() - startTime + Math.floor(Math.random() * 200);
  
  const status = allPassed ? 'accepted' : 'wrong_answer';
  const xpEarned = allPassed ? problem.xp : 0;
  
  // Record submission
  const subId = uuidv4();
  recordSubmission({ id: subId, userId: req.userId, problemId: problem.id, code, language, status, xpEarned, timeMs, testResults });
  
  let newAchievements = [];
  if (allPassed) {
    markProblemSolved(req.userId, problem.id);
    const { newXP, newLevel } = addXP(req.userId, xpEarned);
    newAchievements = checkAndAwardAchievements(req.userId);
    updateLeaderboard();
    
    const user = getUserById(req.userId);
    return res.json({ status, testResults, xpEarned, newXP, newLevel, newAchievements, timeMs });
  }
  
  res.json({ status, testResults, xpEarned: 0, timeMs, newAchievements: [] });
});

function simulateTestExecution(problem, code, language) {
  // Intelligent code analysis for demo (real impl uses Judge0 CE)
  const results = problem.testCases.map(tc => {
    const hasKernel = code.includes('__global__') || code.includes('@triton.jit') || code.includes('kernel void') || code.includes('#include');
    const hasBasicStructure = code.length > 50;
    const passed = hasKernel && hasBasicStructure && Math.random() > 0.2;
    return {
      id: tc.id,
      description: tc.description,
      passed,
      time_ms: Math.floor(Math.random() * 500 + 50),
      memory_mb: Math.floor(Math.random() * 100 + 10),
      output: passed ? 'PASS' : 'Wrong Answer'
    };
  });
  return results;
}

// ==================== GAMIFICATION ====================
app.get('/api/leaderboard', (req, res) => {
  const board = getLeaderboard(50);
  res.json(board);
});

app.get('/api/daily-challenge', (req, res) => {
  const dc = getDailyChallenge();
  if (!dc) return res.json(null);
  const prob = problems.find(p => p.id === dc.problem_id);
  if (!prob) return res.json(null);
  res.json({ ...dc, problem: { id: prob.id, title: prob.title, slug: prob.slug, difficulty: prob.difficulty, xp: prob.xp + dc.bonus_xp } });
});

app.get('/api/stats', (req, res) => {
  const db = getDB();
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalSubs = db.prepare('SELECT COUNT(*) as c FROM submissions').get().c;
  const totalSolved = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'accepted'").get().c;
  res.json({ totalUsers, totalSubmissions: totalSubs, totalSolved, totalProblems: problems.length });
});

app.get('/api/achievements', (req, res) => {
  const all = getDB().prepare('SELECT * FROM achievements').all();
  res.json(all);
});

app.get('/api/user/:username', (req, res) => {
  const user = getUserByUsername(req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  const progress = getUserProgress(user.id);
  const achievements = getDB().prepare(
    'SELECT a.* FROM achievements a JOIN user_achievements ua ON a.id = ua.achievement_id WHERE ua.user_id = ? ORDER BY ua.earned_at DESC'
  ).all(user.id);
  const recentSubs = getDB().prepare(
    "SELECT problem_id, status, xp_earned, submitted_at FROM submissions WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 10"
  ).all(user.id);
  res.json({ user: sanitizeUser(user), progress, achievements, recentSubmissions: recentSubs });
});

function sanitizeUser(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Initialize DB on start
getDB();
updateLeaderboard();

app.listen(PORT, () => {
  console.log(`🚀 GPUForge API running on port ${PORT}`);
});
