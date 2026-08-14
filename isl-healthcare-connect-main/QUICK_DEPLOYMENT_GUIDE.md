# 🚀 ISL SETU - QUICK DEPLOYMENT GUIDE

**Last Updated**: August 14, 2026  
**Status**: ✅ PRODUCTION-READY  
**Time to Deploy**: ~2 hours  

---

## ⚡ QUICK START (5 minutes)

### Prerequisites
- Node.js 18+ (for frontend build)
- Python 3.9+ (for backend)
- Vercel account (for frontend hosting)
- Render account (for backend hosting)
- Supabase project (for database)

### One-Time Setup

```bash
# 1. Install frontend dependencies
cd isl-healthcare-connect-main
npm install

# 2. Install backend dependencies  
cd backend
pip install -r requirements.txt

# 3. Set up environment variables
# Create .env.local in project root
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_AI_API_URL=http://localhost:8000
EOF

# 4. Test locally
npm run dev          # Frontend: http://localhost:5174
python main.py       # Backend: http://localhost:8000
```

---

## 📦 DEPLOYMENT STEPS

### Step 1: Deploy Backend to Render (15 minutes)

#### Option A: Using GitHub (Recommended)
```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to https://render.com
# 3. Click "New" → "Web Service"
# 4. Connect your GitHub repository
# 5. Configure:
#    - Name: isl-setu-backend
#    - Environment: Python 3.9
#    - Build: pip install -r requirements.txt
#    - Start: python main.py
#    - Region: Closest to users
#    - Plan: Free or Paid

# 6. Add Environment Variables in Render:
#    ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
#    DATABASE_URL=postgresql://... (if needed)

# 7. Click "Create Web Service"
# 8. Wait for deployment (~2-3 minutes)
# 9. Note the URL: https://isl-setu-backend.onrender.com
```

#### Option B: Manual Deployment
```bash
# From backend directory
render deploy --api-key YOUR_RENDER_API_KEY
```

### Step 2: Deploy Frontend to Vercel (15 minutes)

#### Option A: Using GitHub (Recommended)
```bash
# 1. Go to https://vercel.com/new
# 2. Select "Import Git Repository"
# 3. Select your GitHub repo
# 4. Configure Project:
#    - Framework Preset: Vite
#    - Root Directory: isl-healthcare-connect-main
#    - Build Command: npm run build
#    - Output Directory: dist

# 5. Add Environment Variables:
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_AI_API_URL=https://isl-setu-backend.onrender.com

# 6. Click "Deploy"
# 7. Wait for deployment (~2-3 minutes)
# 8. Note the URL: https://isl-setu.vercel.app
```

#### Option B: CLI Deployment
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts
```

### Step 3: Configure Database (Supabase - 10 minutes)

#### Create Tables
```sql
-- Tables are defined in supabase/schema.sql
-- Run this SQL in Supabase SQL Editor

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create practice_attempts table
CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users,
  sign TEXT,
  result BOOLEAN,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users,
  level TEXT, -- bronze, silver, gold
  score INTEGER,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Create progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users,
  lesson_id TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP
);
```

#### Enable Row-Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can see own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can see own attempts"
  ON practice_attempts FOR SELECT
  USING (auth.uid() = user_id);
```

### Step 4: Update DNS & CORS (5 minutes)

#### Update Backend CORS
In Render dashboard:
```
Settings → Environment → Add Variable
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://isl-setu.vercel.app
```

#### Update Vercel Environment
In Vercel dashboard:
```
Settings → Environment Variables
VITE_AI_API_URL=https://isl-setu-backend.onrender.com
```

#### Configure Custom Domain (Optional)
In Vercel:
```
Settings → Domains → Add Domain
yourdomain.com
```

Update your DNS provider with Vercel's nameservers.

---

## ✅ VERIFICATION STEPS

### 1. Verify Frontend (5 minutes)
```bash
# Visit production URL
https://isl-setu.vercel.app

# Test routes
✅ http://yourdomain.com/           → Loads home
✅ http://yourdomain.com/learn      → Shows lessons
✅ http://yourdomain.com/practice   → Shows practice camera
✅ http://yourdomain.com/voicebridge → Shows VoiceBridge
✅ http://yourdomain.com/assessment → Shows assessment

# Check console
Browser DevTools → Console → No errors
```

### 2. Verify Backend (5 minutes)
```bash
# Test health endpoint
curl https://isl-setu-backend.onrender.com/health
# Expected: {"status": "ok", "service": "ISL Setu AI Sign Recognition Service", ...}

# Test sign list
curl https://isl-setu-backend.onrender.com/api/signs
# Expected: {"classes": [...], "phrases": {...}}

# Test prediction
curl -X POST https://isl-setu-backend.onrender.com/api/predict-sign \
  -H "Content-Type: application/json" \
  -d '{"mode": "demo", "target_sign": "HELLO"}'
# Expected: {"success": true, "sign": "HELLO", ...}
```

### 3. Verify Database (5 minutes)
In Supabase Dashboard:
```
✅ Tables exist (users, practice_attempts, certificates, user_progress)
✅ Auth configured
✅ RLS policies enabled
✅ Can write test data
✅ Can read test data
```

### 4. Verify Videos (5 minutes)
```bash
# Videos should be served from Vercel's CDN
curl -I https://yourdomain.com/dataset-videos/Hello.mp4
# Expected: HTTP 200, Content-Type: video/mp4

# Test all videos
for video in Hello.mp4 "Thank you.mp4" Fever.mp4 Come.mp4 Drink.mp4; do
  curl -I "https://yourdomain.com/dataset-videos/$video"
done
# All should return 200
```

---

## 🧪 SMOKE TEST (10 minutes)

### Test Checklist
```
[ ] Home page loads
[ ] Learn dashboard displays
[ ] First lesson loads (Greetings)
[ ] Video plays without errors
[ ] Quiz displays and scores
[ ] Practice camera initializes
[ ] VoiceBridge captures signs
[ ] Assessment starts
[ ] Certification accessible
[ ] No console errors
```

### Expected Results
- All pages load < 3 seconds
- All videos play smoothly
- Quiz auto-advances
- No errors in console
- Responsive on mobile

---

## 🔧 TROUBLESHOOTING

### Frontend Not Loading
```
1. Check Vercel deployment logs
2. Verify environment variables set
3. Check browser console for errors
4. Clear browser cache (Cmd+Shift+R)
5. Try in incognito window
```

### Backend Not Responding
```
1. Check Render deployment logs
2. Verify backend service is running
3. Check CORS origins in environment
4. Test /health endpoint directly
5. Check network connectivity
```

### Videos Returning 404
```
1. Verify /public/videos/dataset-videos/ folder exists
2. Check file names match mock data
3. Verify Vercel deployment includes /public
4. Check static file serving configuration
5. Count files: (Get-ChildItem ... | Measure-Object).Count
```

### Database Not Connecting
```
1. Verify VITE_SUPABASE_URL set correctly
2. Verify VITE_SUPABASE_ANON_KEY set correctly
3. Check Supabase project status
4. Verify tables exist (SELECT * FROM users)
5. Check network connectivity to Supabase
```

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Build passes: `npm run build` → No errors
- [ ] All tests pass
- [ ] Environment variables documented
- [ ] Backend deployed to Render
- [ ] Database tables created
- [ ] Supabase configured
- [ ] CORS origins updated

### Deployment
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Render
- [ ] DNS configured (if custom domain)
- [ ] SSL certificates valid

### Post-Deployment
- [ ] Smoke test all routes (10 routes)
- [ ] Smoke test all videos (61 videos)
- [ ] Test complete learning path
- [ ] Test practice camera
- [ ] Test VoiceBridge
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Set up alerts

---

## 📈 PERFORMANCE TARGETS

| Metric | Target | Status |
|--------|--------|--------|
| Home Load Time | < 2 seconds | ✅ |
| Lesson Load Time | < 3 seconds | ✅ |
| Video Play | Smooth, no buffering | ✅ |
| Quiz Auto-Advance | < 2 seconds | ✅ |
| Practice Detection | < 1 second | ⏳ |
| Bundle Size | < 1 MB | ✅ |
| Lighthouse Score | > 90 | ⏳ |

---

## 🔐 SECURITY CHECKLIST

### Frontend
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] No secrets in code
- [ ] Environment variables used for sensitive data
- [ ] CSP headers configured

### Backend
- [ ] HTTPS enforced
- [ ] CORS limited to trusted origins
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] Error messages don't leak data

### Database
- [ ] RLS policies enabled
- [ ] Authentication required
- [ ] Row-level security enforced
- [ ] Sensitive data encrypted
- [ ] Backups configured

---

## 📞 SUPPORT RESOURCES

### Documentation
- [PRODUCTION_READY_SUMMARY.md](PRODUCTION_READY_SUMMARY.md) - Full status
- [EXECUTION_PLAN.md](EXECUTION_PLAN.md) - Test plans
- [TESTING_LOG.md](TESTING_LOG.md) - Test results
- [AI_ARCHITECTURE_AUDIT.md](AI_ARCHITECTURE_AUDIT.md) - Architecture

### Deployment Platforms
- Vercel: https://vercel.com/docs
- Render: https://render.com/docs
- Supabase: https://supabase.com/docs

### Emergency Contacts
- GitHub Issues: Report bugs
- Vercel Support: Deployment issues
- Render Support: Backend issues
- Supabase Support: Database issues

---

## ⏱️ ESTIMATED TIMELINE

| Task | Duration | Cumulative |
|------|----------|------------|
| Backend Deployment | 15 min | 15 min |
| Frontend Deployment | 15 min | 30 min |
| Database Setup | 10 min | 40 min |
| DNS/CORS Config | 5 min | 45 min |
| Verification | 20 min | 65 min |
| Smoke Testing | 15 min | 80 min |
| **TOTAL** | **~1.5 hours** | |

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Monitor** - Watch logs for errors
2. **Gather Feedback** - Get user feedback
3. **Optimize** - Improve performance based on metrics
4. **Scale** - Add caching, CDN if needed
5. **Enhance** - Add features based on user requests

---

**Deployed By**: ISL Setu DevOps Team  
**Status**: Ready for Production  
**Support**: Contact ISL Setu Technical Team  

🚀 **Ready to Launch!**
