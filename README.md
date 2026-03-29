# ⚡ GPUForge — GPU Programming Arena

> LeetCode for GPU Programmers. Master CUDA, Metal, Vulkan, SIMD, and hardware architecture.

---

## 🚀 What You Get

- **12 problems** across 7 categories (CUDA, Memory Architecture, Parallel Algorithms, Hardware Architecture, Advanced GPU, Hardware Fundamentals, Metal/Vulkan)
- **3 difficulty tiers**: Novice 🌱 · Warrior ⚔️ · Legend 💀
- **Monaco Editor** (VS Code's editor, in the browser)
- **XP system, leveling, 12 achievements, 10 titles**
- **Global leaderboard** with podium + rankings
- **Daily challenges** with bonus XP
- **Discussion threads** per problem
- **SQLite database** (zero infrastructure)
- **Full auth** (register/login/sessions)

---

## 📁 Project Structure

```
gpuforge/
├── backend/                 # Express.js API
│   ├── server.js           # Dev server (API only)
│   ├── server.prod.js      # Prod server (API + serves frontend)
│   ├── problems/
│   │   └── problems.js     # All problem definitions
│   ├── db/
│   │   └── database.js     # SQLite schema + queries
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/          # HomePage, ProblemsPage, ProblemDetailPage, etc.
│   │   ├── components/     # Navbar
│   │   └── hooks/          # useAPI, useAuth
│   ├── index.html
│   └── package.json
├── render.yaml             # Render.com deployment
└── package.json            # Root workspace
```

---

## 🛠️ LOCAL DEVELOPMENT

### 1. Clone and install
```bash
git clone <your-repo-url> gpuforge
cd gpuforge

# Install all dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run both servers
```bash
# Terminal 1 — Backend API (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

### 3. Open http://localhost:5173

That's it. SQLite database is auto-created on first run.

---

## 🌐 PRODUCTION DEPLOYMENT

### Option A: Render.com (RECOMMENDED — Free, No Credit Card)

**Total cost: $0/month**

#### Step 1: Push to GitHub
```bash
cd gpuforge
git init
git add .
git commit -m "feat: initial GPUForge"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gpuforge.git
git push -u origin main
```

#### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → Sign up free
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your `gpuforge` repo
5. Render detects `render.yaml` automatically
6. Click **"Apply"**

Render will:
- Build and deploy the backend (Web Service, free tier)
- Build and deploy the frontend (Static Site, free)
- Attach a 1GB disk for SQLite persistence

**⚠️ Free tier note:** Render's free web services spin down after 15 min of inactivity (cold start ~30s on next request). To avoid this, use the "Single Process" deploy below.

#### Step 2 (Alternative): Single Process Deploy on Render

Instead of two services, use ONE service that serves both API and frontend:

```bash
# In backend/ — update package.json start script:
# "start": "node server.prod.js"
```

Then in render.yaml, only use the backend service. The `server.prod.js` serves the built React app from `../frontend/dist`.

Build command for single service:
```
cd ../frontend && npm install && npm run build && cd ../backend && npm install
```

Start command:
```
node server.prod.js
```

---

### Option B: Railway.app (Also Free — $5 credit/month free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Set environment variables
railway variables set PORT=3001 NODE_ENV=production

# Get your backend URL, then deploy frontend to Vercel (free)
```

---

### Option C: Fly.io (Free tier: 3 shared VMs)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd backend
fly launch --name gpuforge-api
fly deploy

# Frontend: deploy to Vercel or Netlify for free
```

---

### Option D: Self-Host on a VPS (Oracle Cloud Always Free / Google Cloud Free Tier)

**Oracle Cloud Always Free:** 2 AMD VMs with 1GB RAM each — permanently free.

```bash
# On your VPS (Ubuntu 22.04)

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repo
git clone https://github.com/YOUR_USERNAME/gpuforge.git
cd gpuforge

# Install deps
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ../backend

# Start with PM2
pm2 start server.prod.js --name gpuforge
pm2 startup  # auto-start on reboot
pm2 save

# Install nginx for reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/gpuforge
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gpuforge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Free SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option E: Vercel + Render Split (Best Performance, Still Free)

**Frontend → Vercel (free, CDN-backed)**
```bash
cd frontend
npm install -g vercel
vercel

# Set env var in Vercel dashboard:
# VITE_API_URL = https://your-backend.onrender.com/api
```

**Backend → Render Web Service (free)**
- Point to `backend/` directory
- Build: `npm install`
- Start: `node server.js`
- Add env: `FRONTEND_URL=https://your-frontend.vercel.app`

---

## 🔧 ENVIRONMENT VARIABLES

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | `*` | CORS allowed origin |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API URL |

---

## 🏗️ ADDING REAL CODE EXECUTION (Judge0 CE)

The current system simulates test execution. To run actual CUDA/C++ code:

### Option 1: Self-host Judge0 Community Edition (Free, Open Source)

```bash
# Judge0 CE runs in Docker
git clone https://github.com/judge0/judge0.git
cd judge0
docker-compose up -d
```

Judge0 CE runs at `http://localhost:2358`. Update `server.js`:

```javascript
// Replace simulateTestExecution with:
async function executeCode(code, language, stdin) {
  const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
  
  // Language IDs: CUDA=79 (custom), C++=54, Python=71
  const langMap = { cuda: 54, cpp: 54, c: 50, python: 71, triton: 71 };
  
  const submission = await fetch(`${JUDGE0_URL}/submissions?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: Buffer.from(code).toString('base64'),
      language_id: langMap[language] || 54,
      stdin: Buffer.from(stdin || '').toString('base64'),
      cpu_time_limit: 10,
      memory_limit: 512000,
    })
  });
  
  const result = await submission.json();
  return {
    stdout: Buffer.from(result.stdout || '', 'base64').toString(),
    stderr: Buffer.from(result.stderr || '', 'base64').toString(),
    status: result.status?.description,
    time: result.time,
    memory: result.memory,
  };
}
```

### Option 2: Sphere Engine API (Paid but has free trial)
### Option 3: GitHub Actions as executor (creative serverless approach)

---

## 📊 TECH STACK SUMMARY

| Layer | Tech | Cost |
|-------|------|------|
| Frontend | React 18 + Vite | Free |
| Editor | Monaco Editor | Free |
| Backend | Express.js (Node 20) | Free |
| Database | SQLite via better-sqlite3 | Free |
| Auth | Custom token sessions | Free |
| Hosting (recommended) | Render.com | Free |
| CDN (optional) | Vercel (frontend) | Free |
| Code execution | Simulated (Judge0 CE optional) | Free |

**Total infrastructure cost: $0/month**

---

## ➕ ADDING NEW PROBLEMS

Edit `backend/problems/problems.js` and add a new object to the `problems` array:

```javascript
{
  id: "unique-problem-id",
  title: "Problem Title",
  slug: "url-slug",
  difficulty: "novice" | "warrior" | "legend",
  category: "CUDA Fundamentals",  // match existing or create new
  xp: 150,
  tags: ["cuda", "memory"],
  description: `## Problem Title\n\nMarkdown description here...`,
  examples: [{ input: "...", output: "..." }],
  hints: ["Hint 1", "Hint 2"],
  starterCode: {
    cuda: `// CUDA starter code`,
    cpp: `// C++ fallback`
  },
  solution: `// Reference solution (never sent to client)`,
  testCases: [
    { id: 1, description: "Basic correctness", pass: true },
    { id: 2, description: "Edge case", pass: true }
  ],
  conceptExplanation: "Brief explanation of the underlying concept",
  companies: ["NVIDIA", "Google"],
  acceptance: 65  // % acceptance rate for display
}
```

No database migration needed — problems are code-defined. Just restart the server.

---

## 🎮 GAMIFICATION SYSTEM

| Event | XP |
|-------|-----|
| Solve Novice problem | 50-75 XP |
| Solve Warrior problem | 150-250 XP |
| Solve Legend problem | 300-500 XP |
| Daily challenge bonus | +50-100 XP |
| Achievement unlocks | 25-1000 XP |

### Level Titles
| Level | Title |
|-------|-------|
| 1 | Shader Noob |
| 2 | Thread Wrangler |
| 3 | Memory Bandit |
| 4 | Warp Commander |
| 5 | Kernel Wizard |
| 6 | SIMD Sorcerer |
| 7 | Cache Whisperer |
| 8 | Occupancy Oracle |
| 9 | Pipeline Prophet |
| 10 | GPU Deity |

### Achievements (12 total)
🩸 First Blood · ⚡ GPU Initiate · 🎮 Warp Commander · 🔮 Kernel Wizard
💀 Legend Tier · ⚡ Speed Demon · 🔥 Week Warrior · 💎 Monthly Grind
✨ Perfectionist · 🧠 Flash Master · 🏛️ Memory Guru · 🔧 Hardware Hacker

---

## 🐛 TROUBLESHOOTING

**Backend won't start:**
```bash
cd backend && rm -f gpuforge.db && npm install && node server.js
```

**Frontend build fails:**
```bash
cd frontend && rm -rf node_modules && npm install && npm run build
```

**CORS errors:**
Set `FRONTEND_URL` env var to your frontend domain (or `*` for dev).

**SQLite errors on Render:**
Make sure you added the Disk in render.yaml and your DB path points to `/data/gpuforge.db`.
Update `DB_PATH` in `db/database.js`:
```javascript
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'gpuforge.db');
```

---

## 📜 LICENSE

MIT — Use it, fork it, build on it, sell it. Just don't claim you invented GPU programming. 🙂
