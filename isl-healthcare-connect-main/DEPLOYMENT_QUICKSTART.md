# ⚡ Vercel + Render - Quick Deployment Card

**Print this page or save as reference during deployment**

---

## 📋 Pre-Deployment Checklist

```
☐ GitHub account logged in
☐ Vercel account created (vercel.com)
☐ Render account created (render.com)
☐ Supabase credentials obtained
☐ Docker tested locally (optional but recommended)
```

---

## 🎯 Deployment in 3 Steps (45 minutes)

### Step 1: Deploy Frontend to Vercel (15 min)

1. **Go**: vercel.com → "Add New" → "Project"
2. **Select**: isl-healthcare-connect repository
3. **Settings**: 
   - Framework: Vite (auto-detected)
   - Root: isl-healthcare-connect-main
4. **Environment Variables** (Add 3):
   ```
   VITE_SUPABASE_URL=https://nndjafynozneorhvpxvg.supabase.co
   VITE_SUPABASE_ANON_KEY=[copy from Supabase → Settings → API]
   VITE_API_URL=https://isl-healthcare-connect-backend.onrender.com
   ```
5. **Click**: "Deploy"
6. **Wait**: 2-3 minutes ✓

**Result**: Frontend live at `https://isl-healthcare-connect.vercel.app`

---

### Step 2: Deploy Backend to Render (20 min)

1. **Go**: render.com → "New +" → "Web Service"
2. **Connect**: GitHub repository
3. **Settings**:
   - Name: `isl-healthcare-connect-backend`
   - Environment: `Docker`
   - Region: `Oregon` (or nearest)
   - Dockerfile: `backend/Dockerfile` ✓
   - Docker Context: `backend` ✓
4. **Environment Variables** (Add 6):
   ```
   PORT=10000
   PYTHONUNBUFFERED=1
   ALLOWED_ORIGINS=https://isl-healthcare-connect.vercel.app,https://*.vercel.app,http://localhost:5173
   SUPABASE_URL=https://nndjafynozneorhvpxvg.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=[copy from Supabase → Settings → API]
   ```
5. **Click**: "Create Web Service"
6. **Wait**: 5-10 minutes (watch logs) ✓

**Result**: Backend live at `https://isl-healthcare-connect-backend.onrender.com`

---

### Step 3: Reconnect Frontend → Backend (10 min)

1. **Go**: Vercel → Project Settings → Environment Variables
2. **Update**: `VITE_API_URL` to your Render backend URL:
   ```
   https://isl-healthcare-connect-backend.onrender.com
   ```
3. **Go**: Deployments → Click latest → "Redeploy"
4. **Wait**: 2-3 minutes ✓

---

## ✅ Quick Verification (5 min)

### Test Backend
```bash
curl https://isl-healthcare-connect-backend.onrender.com/api/health
# Should return: {"status":"ok","model_loaded":true}

curl https://isl-healthcare-connect-backend.onrender.com/api/signs
# Should return: 10 vocabulary items
```

### Test Frontend
1. Open: https://isl-healthcare-connect.vercel.app
2. Press F12 (DevTools)
3. Console tab → Paste:
   ```javascript
   fetch('https://isl-healthcare-connect-backend.onrender.com/api/health')
     .then(r => r.json()).then(d => console.log(d))
   ```
4. Should see: `{status: "ok", model_loaded: true}`

### Test Full Integration
1. Visit: https://isl-healthcare-connect.vercel.app
2. Navigate to Assessment/Practice
3. Try uploading an image
4. Should get sign prediction from backend

---

## 🔑 Critical Environment Variables

| Variable | Vercel | Render | Value |
|----------|--------|--------|-------|
| VITE_SUPABASE_URL | ✓ | ✓ | `https://nndjafynozneorhvpxvg.supabase.co` |
| VITE_SUPABASE_ANON_KEY | ✓ |  | Copy from Supabase (public) |
| VITE_API_URL | ✓ |  | `https://isl-healthcare-connect-backend.onrender.com` |
| SUPABASE_URL |  | ✓ | `https://nndjafynozneorhvpxvg.supabase.co` |
| SUPABASE_SERVICE_ROLE_KEY |  | ✓ | Copy from Supabase (KEEP PRIVATE!) |
| ALLOWED_ORIGINS |  | ✓ | `https://isl-healthcare-connect.vercel.app,https://*.vercel.app` |

---

## 🚨 Common Issues & Quick Fixes

### CORS Error in Browser
```
Issue: "Access to XMLHttpRequest has been blocked by CORS policy"
Fix: 
  1. Render → Environment → ALLOWED_ORIGINS
  2. Add your Vercel URL
  3. "Save & Deploy"
  4. Wait 2 minutes
```

### Backend Shows 503 Error
```
Issue: "Service Unavailable"
Fix: 
  1. Render uses cold starts on free tier
  2. Wait 30-60 seconds
  3. Accessing it wakes it up automatically
  4. Consider upgrading to Starter ($12/mo) for faster starts
```

### "Cannot find module" Errors
```
Issue: Backend logs show Python import errors
Fix:
  1. Check backend/requirements.txt has all packages
  2. Render → Manual Deploy → Deploy
  3. Watch logs for build progress (5-10 min)
```

### Frontend Still Points to Old Backend
```
Issue: VITE_API_URL not updated after deployment
Fix:
  1. Vercel → Environment Variables
  2. Update VITE_API_URL value
  3. Go to Deployments → Latest → "Redeploy"
  4. Wait 2-3 minutes
```

---

## 📱 URLs After Deployment

```
Frontend:    https://isl-healthcare-connect.vercel.app
Backend API: https://isl-healthcare-connect-backend.onrender.com
Database:    supabase.com (existing)
```

---

## 🔄 Auto-Deploy Setup

✅ **Vercel**: Automatic on every push to `main`  
✅ **Render**: Enable "Auto-deploy" in service settings

To deploy updates:
```bash
git add .
git commit -m "Update features"
git push origin main
```

**Vercel**: Deploys in 2-3 minutes automatically  
**Render**: Rebuilds Docker (5-10 min) then deploys automatically

---

## 📞 Need Help?

- **Full Guide**: [VERCEL_RENDER_DEPLOYMENT.md](VERCEL_RENDER_DEPLOYMENT.md)
- **Troubleshooting**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) → Troubleshooting section
- **API Docs**: [API_REFERENCE.md](API_REFERENCE.md)

---

## ⏱️ Timeline

| Step | Duration | Notes |
|------|----------|-------|
| Vercel Frontend | 15 min | 2-3 min build |
| Render Backend | 20 min | 5-10 min Docker build |
| Reconnect & Test | 10 min | Redeploy + verification |
| **Total** | **45 min** | First deployment |

---

## ✨ You're Ready!

**Deployment checklist**:
- ✅ Vercel account created
- ✅ Render account created
- ✅ GitHub authorized
- ✅ Environment variables prepared
- ✅ Supabase credentials on hand

**→ Follow the 3 steps above to deploy!**

---

*Last updated: August 14, 2026*
