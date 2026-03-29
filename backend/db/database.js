// db/database.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { problems } from '../problems/problems.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'gpuforge.db');

let db;

export function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity TEXT,
      avatar TEXT DEFAULT 'gpu',
      title TEXT DEFAULT 'Shader Noob',
      created_at TEXT DEFAULT (datetime('now')),
      solved_count INTEGER DEFAULT 0,
      rank INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      status TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      time_ms INTEGER,
      submitted_at TEXT DEFAULT (datetime('now')),
      test_results TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      status TEXT DEFAULT 'locked',
      attempts INTEGER DEFAULT 0,
      best_time_ms INTEGER,
      solved_at TEXT,
      PRIMARY KEY(user_id, problem_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER DEFAULT 0,
      rarity TEXT DEFAULT 'common'
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_cache (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      xp INTEGER,
      solved_count INTEGER,
      rank INTEGER,
      title TEXT,
      avatar TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      date TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      bonus_xp INTEGER DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed achievements
  const achStmt = db.prepare(`INSERT OR IGNORE INTO achievements VALUES (?,?,?,?,?,?)`);
  const achievements = [
    ['first-blood', 'First Blood', 'Submit your first solution', '🩸', 25, 'common'],
    ['gpu-initiate', 'GPU Initiate', 'Solve 5 problems', '⚡', 50, 'common'],
    ['warp-commander', 'Warp Commander', 'Solve 25 problems', '🎮', 150, 'rare'],
    ['kernel-wizard', 'Kernel Wizard', 'Solve all CUDA Fundamentals', '🔮', 300, 'epic'],
    ['legend-tier', 'Legend Tier', 'Solve a Legend difficulty problem', '💀', 500, 'legendary'],
    ['speed-demon', 'Speed Demon', 'Submit in under 10 minutes', '⚡', 100, 'rare'],
    ['streak-7', 'Week Warrior', '7-day streak', '🔥', 200, 'rare'],
    ['streak-30', 'Monthly Grind', '30-day streak', '💎', 1000, 'legendary'],
    ['perfectionist', 'Perfectionist', 'Solve a problem on first try', '✨', 75, 'rare'],
    ['flash-master', 'Flash Master', 'Solve Flash Attention problem', '🧠', 750, 'legendary'],
    ['memory-guru', 'Memory Guru', 'Solve all Memory Architecture problems', '🏛️', 400, 'epic'],
    ['hardware-hacker', 'Hardware Hacker', 'Solve all Hardware Fundamentals', '🔧', 350, 'epic'],
  ];
  const seedAch = db.transaction(() => achievements.forEach(a => achStmt.run(...a)));
  seedAch();

  // Seed daily challenges (next 7 days)
  const dcStmt = db.prepare(`INSERT OR IGNORE INTO daily_challenges VALUES (?,?,?)`);
  const probIds = problems.map(p => p.id);
  const today = new Date();
  const seedDC = db.transaction(() => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dcStmt.run(dateStr, probIds[i % probIds.length], 75 + (i * 10));
    }
  });
  seedDC();
}

export function getUserById(id) {
  return getDB().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByUsername(username) {
  return getDB().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function createUser(id, username, email, passwordHash) {
  return getDB().prepare(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)'
  ).run(id, username, email, passwordHash);
}

export function addXP(userId, amount) {
  const db = getDB();
  db.prepare('UPDATE users SET xp = xp + ?, solved_count = solved_count + 1 WHERE id = ?').run(amount, userId);
  const user = getUserById(userId);
  const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
  const titles = ['Shader Noob', 'Thread Wrangler', 'Memory Bandit', 'Warp Commander', 
                  'Kernel Wizard', 'SIMD Sorcerer', 'Cache Whisperer', 'Occupancy Oracle',
                  'Pipeline Prophet', 'GPU Deity'];
  const title = titles[Math.min(newLevel - 1, titles.length - 1)];
  db.prepare('UPDATE users SET level = ?, title = ? WHERE id = ?').run(newLevel, title, userId);
  return { newXP: user.xp + amount, newLevel };
}

export function updateLeaderboard() {
  const db = getDB();
  const users = db.prepare('SELECT id, username, xp, solved_count, title, avatar FROM users ORDER BY xp DESC LIMIT 100').all();
  const stmt = db.prepare(`INSERT OR REPLACE INTO leaderboard_cache (user_id, username, xp, solved_count, rank, title, avatar) VALUES (?,?,?,?,?,?,?)`);
  const update = db.transaction(() => users.forEach((u, i) => stmt.run(u.id, u.username, u.xp, u.solved_count, i+1, u.title, u.avatar)));
  update();
}

export function getLeaderboard(limit = 50) {
  return getDB().prepare('SELECT * FROM leaderboard_cache ORDER BY rank LIMIT ?').all(limit);
}

export function getUserProgress(userId) {
  return getDB().prepare('SELECT * FROM user_progress WHERE user_id = ?').all(userId);
}

export function recordSubmission(sub) {
  return getDB().prepare(
    `INSERT INTO submissions (id, user_id, problem_id, code, language, status, xp_earned, time_ms, test_results) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(sub.id, sub.userId, sub.problemId, sub.code, sub.language, sub.status, sub.xpEarned, sub.timeMs, JSON.stringify(sub.testResults));
}

export function markProblemSolved(userId, problemId) {
  const db = getDB();
  const existing = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND problem_id = ?').get(userId, problemId);
  if (existing) {
    db.prepare('UPDATE user_progress SET status = ?, solved_at = datetime("now"), attempts = attempts + 1 WHERE user_id = ? AND problem_id = ?')
      .run('solved', userId, problemId);
  } else {
    db.prepare('INSERT INTO user_progress (user_id, problem_id, status, attempts, solved_at) VALUES (?, ?, ?, 1, datetime("now"))')
      .run(userId, problemId, 'solved');
  }
}

export function checkAndAwardAchievements(userId) {
  const db = getDB();
  const user = getUserById(userId);
  const progress = getUserProgress(userId);
  const solved = progress.filter(p => p.status === 'solved');
  
  const awards = [];
  const awardAch = (achId) => {
    const existing = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achId);
    if (!existing) {
      db.prepare('INSERT INTO user_achievements VALUES (?, ?, datetime("now"))').run(userId, achId);
      const ach = db.prepare('SELECT * FROM achievements WHERE id = ?').get(achId);
      if (ach) { db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(ach.xp_reward, userId); awards.push(ach); }
    }
  };

  if (solved.length >= 1) awardAch('first-blood');
  if (solved.length >= 5) awardAch('gpu-initiate');
  if (solved.length >= 25) awardAch('warp-commander');
  
  return awards;
}

export function getDailyChallenge() {
  const today = new Date().toISOString().split('T')[0];
  return getDB().prepare('SELECT * FROM daily_challenges WHERE date = ?').get(today);
}

export function addDiscussion(id, problemId, userId, username, content) {
  return getDB().prepare('INSERT INTO discussions VALUES (?,?,?,?,?,0,datetime("now"))').run(id, problemId, userId, username, content);
}

export function getDiscussions(problemId) {
  return getDB().prepare('SELECT * FROM discussions WHERE problem_id = ? ORDER BY upvotes DESC, created_at DESC').all(problemId);
}
