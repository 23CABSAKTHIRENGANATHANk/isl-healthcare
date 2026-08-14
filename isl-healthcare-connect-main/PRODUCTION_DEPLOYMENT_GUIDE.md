# ISL Healthcare Connect - Production Deployment Guide

**Date**: August 14, 2026  
**Status**: Ready for Production Deployment

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                        │
│  React 19 + Vite + TanStack Start                           │
│  https://yourdomain.com                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─────────────────────────────────────────┐
                   │                                         │
         ┌─────────▼─────────┐                   ┌──────────▼────────┐
         │ Backend (Railway) │                   │  Supabase Cloud    │
         │ FastAPI on :8000  │                   │  PostgreSQL + Auth │
         │ Production API    │                   │  Real-time Enabled │
         └───────────────────┘                   └────────────────────┘
```

---

## 📋 Pre-Deployment Checklist

- [x] Frontend: Build passing (0 errors)
- [x] Backend: API endpoints tested
- [x] Linting: All errors fixed (0 errors)
- [x] Environment variables: Configured for dev
- [ ] Production Supabase project: Verified
- [ ] CORS settings: Verified
- [ ] Secrets: Secured in platform
- [ ] Database: Migrations run

---

## Part 1: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account & Connect GitHub

1. Go to https://vercel.com
2. Sign up / Log in
3. Click "Add New" → "Project"
4. Import your GitHub repository

### Step 2: Configure Build Settings

**Vercel will auto-detect:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

**Verify settings:**
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

### Step 3: Set Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```env
# Supabase Configuration (Public Keys - safe to expose)
VITE_SUPABASE_PROJECT_ID=nndjafynozneorhvpxvg
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGphZnlub3puZW9yaHZweHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgzMjMsImV4cCI6MjEwMjIxNDMyM30.MFA0pG6wXkAckMYHQb_ALOAjyuKkNfegTtsLwtnzaW8
VITE_SUPABASE_URL=https://nndjafynozneorhvpxvg.supabase.co

# Backend API URL (Set in next section)
VITE_API_URL=https://isl-healthcare-backend.railway.app
```

### Step 4: Deploy

1. Vercel will auto-deploy on every push to `main`
2. Your app will be live at `https://yourdomain.vercel.app` (custom domain available)
3. View logs in Vercel dashboard

---

## Part 2: Backend Deployment (Railway)

### Step 1: Prepare Backend for Railway

Create `.railway/nixpack.toml` in project root:

```toml
[build]
nixpkgs = ["python311", "python311Packages.pip"]

[[build.packages]]
name = "python311-dev"
```

Create `backend/Procfile`:

```
web: cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT main:app
```

### Step 2: Update Backend Requirements

**backend/requirements.txt** (add if missing):

```txt
fastapi==0.110.0
uvicorn[standard]==0.24.0
pydantic==2.5.3
python-multipart==0.0.6
opencv-python==4.8.1.78
mediapipe==0.10.11
reportlab==4.0.9
python-dotenv==1.0.0
gunicorn==21.2.0
```

### Step 3: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Select the root directory (not `/backend`)
5. Set up environment variables:

```env
BACKEND_URL=0.0.0.0:8000
ENVIRONMENT=production
```

### Step 4: Configure Railway Environment Variables

In Railway dashboard → **Variables**:

```env
PORT=8000
PYTHONUNBUFFERED=1
```

---

## Part 3: Database Setup (Supabase)

### Verify Production Supabase Configuration

1. Go to https://app.supabase.com
2. Select your production project
3. Verify these settings:

**Settings → Authentication:**
- Enable JWT authentication ✓
- Redirect URLs configured ✓

**Settings → Database:**
- Row-Level Security (RLS) enabled ✓
- Backups configured ✓
- Connection pooling enabled (recommended)

**Settings → API:**
- Verify `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` match your .env

---

## Part 4: Environment Variables Reference

### Frontend (.env.production)

```env
# These should match production Supabase project
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-prod-key
VITE_API_URL=https://your-backend-api.railway.app
```

### Backend (backend/.env)

```env
# For production, set actual values or use Railway secrets
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_KEY=your-prod-service-role-key
CORS_ORIGINS=https://your-frontend-domain.vercel.app
ENVIRONMENT=production
```

**IMPORTANT**: Never commit secrets to git. Use platform-managed secrets:
- Vercel: Environment Variables UI
- Railway: Variables UI

---

## Part 5: Verification Checklist

After deployment, verify:

### ✅ Frontend Tests

```bash
# Visit your Vercel URL
curl https://your-app.vercel.app
# Should return HTML with meta tags

# Check API connectivity
curl https://your-backend-api.railway.app/api/health
# Should return: {"status": "ok", "model_loaded": true}
```

### ✅ API Endpoint Tests

```bash
# Health check
curl https://your-backend-api.railway.app/api/health

# Get signs vocabulary
curl https://your-backend-api.railway.app/api/signs

# Test prediction (POST with image)
curl -X POST https://your-backend-api.railway.app/api/predict-sign \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "...", "demo_mode": true}'

# Certificate generation
curl https://your-backend-api.railway.app/api/certificate/test/pdf \
  -o certificate.pdf
```

### ✅ Database Tests

1. Supabase Dashboard → SQL Editor
2. Run test query:
```sql
SELECT COUNT(*) FROM auth.users;
```
3. Should return successfully

### ✅ CORS Verification

Frontend should make cross-origin requests to backend without CORS errors:

```javascript
// In browser console on production URL
fetch('https://your-backend-api.railway.app/api/health')
  .then(r => r.json())
  .then(console.log)
// Should work without CORS error
```

---

## Part 6: Post-Deployment Monitoring

### Set Up Alerts

**Vercel:**
- Deployment failures
- Build errors
- Production errors

**Railway:**
- Application crashes
- Memory/CPU issues
- Database connection errors

### View Logs

**Vercel:**
```
Dashboard → Deployments → Recent → Logs
```

**Railway:**
```
Dashboard → Services → Logs
```

---

## Part 7: Custom Domain Setup

### For Vercel Frontend:

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Domains
4. Add your domain (yourdomain.com)
5. Update DNS records as instructed

### For Railway Backend:

1. Go to Railway Dashboard
2. Select Backend Service
3. Settings → Custom Domain
4. Add your domain (api.yourdomain.com)
5. Update DNS records

---

## Part 8: Rollback Procedure

### If Deployment Fails

**Vercel:**
- Click on previous successful deployment
- Click "Redeploy"

**Railway:**
- Select previous build
- Click "Redeploy"

---

## Part 9: Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| CORS errors | Verify `CORS_ORIGINS` matches frontend URL in backend |
| 502 Bad Gateway | Check backend logs: `Railway → Logs` |
| Build fails on Vercel | Check build output, ensure `npm run build` works locally |
| API timeout | Increase Railway memory/CPU allocation |
| Database connection error | Verify Supabase credentials in environment variables |
| Static files 404 | Ensure `dist/` is built and deployed correctly |

---

## Part 10: Performance Optimization

### Bundle Size
- ✅ Already optimized: 424KB gzipped (manualChunks configured)
- Frontend: ~280KB gzip
- Radix UI: ~44KB gzip
- Recharts: ~102KB gzip

### Database Queries
- Enable Supabase query performance monitoring
- Review slow queries regularly

### API Caching
- Consider Redis for frequently accessed data
- Implement HTTP caching headers on Railway

---

## Deployment Timeline

```
1. Prepare code (DONE ✓)
   ↓
2. Set up Vercel frontend (30 min)
   ↓
3. Set up Railway backend (20 min)
   ↓
4. Configure environment variables (10 min)
   ↓
5. Run verification tests (15 min)
   ↓
6. Enable monitoring & alerts (10 min)
   ↓
7. ✅ LIVE IN PRODUCTION
```

**Total Time Estimate: ~90 minutes**

---

## Next Steps

1. [ ] Create Vercel account
2. [ ] Connect GitHub repository
3. [ ] Configure environment variables
4. [ ] Deploy frontend
5. [ ] Create Railway account
6. [ ] Deploy backend
7. [ ] Run verification tests
8. [ ] Monitor in production
9. [ ] Set up custom domain
10. [ ] Document deployment procedure

---

## Contact & Support

**Deployment Issues?**
- Vercel Support: https://vercel.com/support
- Railway Support: https://railway.app/support
- Supabase Docs: https://supabase.com/docs

**Project Repository:**
- Push changes to trigger automatic deployments
- All secrets managed via platform UIs (never commit to git)

---

**Status**: 🎉 Ready for Production Deployment
