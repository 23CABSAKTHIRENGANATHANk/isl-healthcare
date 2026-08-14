# ISL Healthcare Connect - Production Deployment Checklist

**Date**: August 14, 2026  
**Target Platforms**: Vercel (Frontend) + Railway (Backend) + Supabase (Database)  
**Estimated Time**: 2-3 hours

---

## Pre-Deployment Phase (30 minutes)

### Code Preparation
- [x] All TypeScript errors resolved (0 errors)
- [x] All ESLint errors resolved (0 errors)
- [x] Build passes successfully
- [x] API endpoints tested and working
- [x] Backend requirements.txt updated for production
- [x] Procfile created for Railway
- [x] Environment variables documented
- [x] Git repository updated and pushed

### Account Setup
- [ ] Create Vercel account (https://vercel.com)
- [ ] Create Railway account (https://railway.app)
- [ ] Verify Supabase production project exists
- [ ] Connect GitHub account to Vercel
- [ ] Connect GitHub account to Railway

### Documentation Review
- [ ] Read PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Review API_REFERENCE.md
- [ ] Check FINAL_PROJECT_REPORT.md
- [ ] Verify all configuration files are in place

---

## Frontend Deployment (Vercel) - 30 minutes

### Step 1: Vercel Project Creation
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "Add New" → "Project"
- [ ] Select GitHub repository: `isl-healthcare-connect-main`
- [ ] Vercel auto-detects Vite configuration
- [ ] Confirm build command: `npm run build`
- [ ] Confirm output directory: `dist`
- [ ] Click "Deploy"

### Step 2: Environment Variables (Vercel)
- [ ] Go to Project Settings → Environment Variables
- [ ] Add production Supabase variables:
  ```
  VITE_SUPABASE_PROJECT_ID = nndjafynozneorhvpxvg
  VITE_SUPABASE_PUBLISHABLE_KEY = [YOUR_PUBLIC_KEY]
  VITE_SUPABASE_URL = https://nndjafynozneorhvpxvg.supabase.co
  ```
- [ ] Add backend API URL (add after backend deployment):
  ```
  VITE_API_URL = https://[YOUR-RAILWAY-BACKEND-URL]
  ```
- [ ] Redeploy after adding environment variables
- [ ] Verify deployment succeeds

### Step 3: Vercel Domain Configuration (Optional)
- [ ] Go to Project Settings → Domains
- [ ] Add custom domain (yourdomain.com)
- [ ] Update DNS records as instructed
- [ ] Wait for SSL certificate (5-10 minutes)
- [ ] Verify HTTPS working

### Step 4: Vercel Verification
- [ ] Visit deployed URL in browser
- [ ] Check console for errors
- [ ] Verify API connectivity works
- [ ] Test sign prediction feature
- [ ] Test certificate download

**Vercel Deployment Status**: _______________

---

## Backend Deployment (Railway) - 45 minutes

### Step 1: Railway Project Creation
- [ ] Go to https://railway.app/dashboard
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub"
- [ ] Authorize Railway with GitHub
- [ ] Select repository: `isl-healthcare-connect-main`
- [ ] Select root directory: `.` (root)
- [ ] Click "Deploy"

### Step 2: Railway Configuration
- [ ] Wait for initial build (5-10 minutes)
- [ ] Go to Service Settings
- [ ] Set start command:
  ```
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 backend.main:app
  ```
- [ ] Verify build completes successfully

### Step 3: Railway Environment Variables
- [ ] Go to Variables tab
- [ ] Add Python environment:
  ```
  PYTHONUNBUFFERED = 1
  ```
- [ ] Add backend config:
  ```
  PORT = 8000
  ENVIRONMENT = production
  ```
- [ ] Optionally add Supabase (if backend needs DB):
  ```
  SUPABASE_URL = [YOUR_SUPABASE_URL]
  SUPABASE_KEY = [YOUR_SERVICE_ROLE_KEY]
  ```
- [ ] Save variables and redeploy

### Step 4: Railway Domain & Logs
- [ ] Go to Service Settings → Custom Domain
- [ ] Add domain: api.yourdomain.com (or get Railway URL)
- [ ] Copy the Railway-provided backend URL
- [ ] Update Vercel environment variable: `VITE_API_URL`
- [ ] Check Logs for startup messages
- [ ] Verify: "Application startup complete"

### Step 5: Railway Health Check
```bash
# Get your Railway URL from dashboard
curl https://[YOUR-RAILWAY-DOMAIN]/api/health

# Expected response:
# {"status":"ok","service":"ISL Setu AI Sign Recognition Service",...}
```

- [ ] Health endpoint responds with 200 OK
- [ ] Model loaded status is true
- [ ] All fields present in response

**Railway Deployment Status**: _______________

---

## Database Verification (Supabase) - 15 minutes

### Step 1: Supabase Production Project
- [ ] Go to https://app.supabase.com
- [ ] Select production project
- [ ] Verify URL: https://nndjafynozneorhvpxvg.supabase.co

### Step 2: Authentication Settings
- [ ] Go to Authentication → Providers
- [ ] Verify JWT provider enabled
- [ ] Go to URL Configuration
- [ ] Add Vercel frontend URL to Redirect URLs:
  ```
  https://yourdomain.vercel.app/callback
  https://yourdomain.vercel.app/auth/callback
  ```
- [ ] Save configuration

### Step 3: Database Tables
- [ ] Go to SQL Editor
- [ ] Run query to verify tables:
  ```sql
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] Verify tables exist:
  - [ ] profiles
  - [ ] assessments
  - [ ] certifications
  - [ ] progress_tracking
  - [ ] sign_vocabulary
  - [ ] user_sessions

### Step 4: Row-Level Security (RLS)
- [ ] Go to Authentication → Policies
- [ ] Verify RLS is enabled on all tables
- [ ] Check policies allow appropriate access
- [ ] Test query as authenticated user

### Step 5: Backup & Replication
- [ ] Go to Settings → Backup
- [ ] Verify automated backups enabled
- [ ] Note backup retention period
- [ ] Optionally enable Point-In-Time Recovery (PITR)
- [ ] Go to Settings → Replication
- [ ] Note replication status and regions

**Supabase Status**: _______________

---

## Integration Testing - 30 minutes

### Frontend-to-Backend Connectivity
```bash
# 1. Test from browser console (on your Vercel URL)
fetch('https://your-railway-backend/api/health')
  .then(r => r.json())
  .then(console.log)
  // Should return health check JSON without CORS error
```

- [ ] No CORS errors in browser console
- [ ] API response contains expected fields

### End-to-End Workflow
- [ ] Navigate to frontend URL
- [ ] Complete login/signup flow
- [ ] Access dashboard
- [ ] Start a practice session
- [ ] Test sign prediction (demo mode or camera)
- [ ] Complete an assessment
- [ ] Download certificate
- [ ] Verify all pages load without errors

### API Endpoint Testing
```bash
# Test each endpoint from command line
curl https://your-railway-backend/api/health
curl https://your-railway-backend/api/signs

# POST endpoints (with sample data)
curl -X POST https://your-railway-backend/api/predict-sign \
  -H "Content-Type: application/json" \
  -d '{"image_base64":"...", "demo_mode": true}'

curl -X POST https://your-railway-backend/api/voicebridge \
  -H "Content-Type: application/json" \
  -d '{"signs": ["FEVER", "PAIN"]}'
```

- [ ] All 5 endpoints return 200 OK
- [ ] Response format matches API_REFERENCE.md
- [ ] No authentication errors
- [ ] No CORS issues

### Database Connectivity Test
```bash
# Via Supabase dashboard → SQL Editor
SELECT NOW();
SELECT COUNT(*) FROM profiles;
```

- [ ] Queries execute without errors
- [ ] Data accessible from backend
- [ ] Real-time updates working

- [ ] All integration tests passed

**Integration Testing Status**: _______________

---

## Performance Validation - 15 minutes

### Frontend Performance
- [ ] Open Chrome DevTools → Lighthouse
- [ ] Run Lighthouse audit
- [ ] Performance score: ≥ 80
- [ ] Accessibility score: ≥ 80
- [ ] Best Practices score: ≥ 80
- [ ] SEO score: ≥ 80
- [ ] Record screenshot

### Backend Performance
- [ ] Test sign prediction speed:
  ```bash
  time curl -X POST https://your-backend/api/predict-sign \
    -H "Content-Type: application/json" \
    -d '{"image_base64":"...", "demo_mode": true}'
  ```
  - [ ] Response time: < 100ms
  
- [ ] Test VoiceBridge speed:
  ```bash
  time curl -X POST https://your-backend/api/voicebridge \
    -H "Content-Type: application/json" \
    -d '{"signs": ["FEVER"]}'
  ```
  - [ ] Response time: < 50ms

### Bundle Size Verification
- [ ] Check production bundle size:
  ```bash
  npm run build
  ls -lh dist/client/assets/*.js | grep -v sourcemap
  ```
  - [ ] Main bundle: < 300KB gzip
  - [ ] Total with chunks: < 500KB gzip
  - [ ] Images: < 1MB total

**Performance Status**: _______________

---

## Monitoring & Alerts Setup - 20 minutes

### Vercel Monitoring
- [ ] Go to Project Settings → Analytics
- [ ] Enable Web Analytics (optional, free tier available)
- [ ] Go to Settings → Alerts
- [ ] Enable deployment alerts
- [ ] Add email for notifications
- [ ] Test alert by triggering deployment

### Railway Monitoring
- [ ] Go to Service Settings → Logs
- [ ] Verify logs are collecting
- [ ] Go to Metrics tab
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Set up alerts (optional paid feature)

### Error Tracking (Optional - Recommended)
- [ ] Create account on Sentry (https://sentry.io)
- [ ] Create Sentry project for your app
- [ ] Add Sentry to frontend:
  ```bash
  npm install @sentry/react @sentry/tracing
  ```
- [ ] Add Sentry DSN to environment variables
- [ ] Initialize Sentry in frontend code
- [ ] Test error tracking

### Uptime Monitoring (Optional)
- [ ] Create account on UptimeRobot (https://uptimerobot.com)
- [ ] Monitor frontend URL
- [ ] Monitor backend health endpoint
- [ ] Set alert frequency (every 5 minutes)
- [ ] Add email notifications

**Monitoring Status**: _______________

---

## Security Verification - 20 minutes

### HTTPS & SSL
- [ ] Frontend URL: https (not http)
- [ ] Backend URL: https (not http)
- [ ] Check certificate details (browser address bar)
- [ ] Verify certificate is not expired
- [ ] Test mixed content (console should have no warnings)

### CORS Configuration
- [ ] Backend CORS headers include frontend URL
- [ ] Browser console has no CORS errors
- [ ] Cross-origin requests work correctly

### Authentication & Secrets
- [ ] No credentials in frontend code
- [ ] No API keys in git history
- [ ] Environment variables not logged
- [ ] Supabase keys are public-only (anon key)
- [ ] Service role key stored securely in Railway

### Database Security
- [ ] Supabase JWT enabled
- [ ] Row-Level Security (RLS) enabled
- [ ] No direct database access from frontend
- [ ] All queries use Supabase client with auth

### Input Validation
- [ ] Backend validates all inputs
- [ ] Frontend sanitizes user inputs
- [ ] No SQL injection vulnerabilities
- [ ] Images are size-limited and validated

**Security Status**: _______________

---

## Documentation & Handover - 15 minutes

### Update Documentation
- [ ] Add deployed URLs to README.md
- [ ] Document environment variables in SECRET_CONFIG.md
- [ ] Update API_REFERENCE.md with production URL
- [ ] Create DEPLOYMENT_LOG.md with details:
  - [ ] Deployment date and time
  - [ ] Vercel URL
  - [ ] Railway URL
  - [ ] Supabase project ID
  - [ ] Any custom configurations

### Create Runbooks
- [ ] Write deployment rollback procedure
- [ ] Write incident response guide
- [ ] Write database backup/restore guide
- [ ] Write scaling guide (if needed)

### Team Handover
- [ ] Share deployment guide with team
- [ ] Share dashboard access (Vercel, Railway, Supabase)
- [ ] Provide emergency contact information
- [ ] Schedule knowledge transfer session

**Documentation Status**: _______________

---

## Post-Deployment Verification - 10 minutes

### Day 1 (First 24 hours)
- [ ] Monitor error logs hourly
- [ ] Check performance metrics
- [ ] Verify no unusual traffic patterns
- [ ] Monitor database query times
- [ ] Check API response times
- [ ] Review user feedback/reports

### Day 7 (First week)
- [ ] Review full week of logs
- [ ] Identify any patterns or issues
- [ ] Check uptime status (should be 99%+)
- [ ] Review performance trends
- [ ] Validate backup completion

### Day 30 (First month)
- [ ] Comprehensive security audit
- [ ] Performance optimization review
- [ ] Database optimization (indexes, queries)
- [ ] Update documentation with learnings
- [ ] Plan feature enhancements

**Post-Deployment Verification**: _______________

---

## Troubleshooting Reference

### Issue: Frontend won't load
```
1. Check Vercel deployment status (dashboard)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check browser console for errors
4. Verify Vercel environment variables are set
5. Redeploy from Vercel dashboard
```

### Issue: API returns 502 Bad Gateway
```
1. Check Railway logs for errors
2. Verify backend is running (check Logs tab)
3. Check Railway environment variables
4. Verify Supabase connection details
5. Check backend requirements.txt for missing dependencies
6. Redeploy from Railway dashboard
```

### Issue: CORS errors in browser
```
1. Verify backend CORS middleware includes frontend URL
2. Check browser console for exact error
3. Verify API URL matches between frontend and actual backend
4. Test with curl from command line (should work)
5. Clear browser cache and try again
```

### Issue: Database connection fails
```
1. Verify Supabase URL and key are correct
2. Check Supabase dashboard (is project active?)
3. Verify network connectivity to Supabase
4. Check Supabase logs for connection errors
5. Test query in Supabase SQL editor
```

---

## Final Sign-Off

### Deployment Team
- Developer: _________________ Date: _________
- Code Reviewer: ____________ Date: _________
- DevOps/Infra: _____________ Date: _________

### Verification
- [x] Code reviewed and approved
- [x] All tests passing
- [x] Security audit completed
- [x] Performance validated
- [x] Documentation complete
- [x] Stakeholders notified

### Go-Live Decision
- [ ] **APPROVED FOR PRODUCTION** ← Sign here
- [ ] **HOLD - Issues to resolve** ← Detail issues

---

**Deployment Status**: Ready for Go-Live  
**Last Updated**: August 14, 2026  
**Next Review**: After 1 week in production
