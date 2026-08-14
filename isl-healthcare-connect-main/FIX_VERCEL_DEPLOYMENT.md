# ⚠️ Fixing Vercel Deployment - "Page Not Responding" Error

**Issue**: Frontend deployed but shows "This page isn't responding"  
**Cause**: Missing environment variables or backend URL not set  
**Fix Time**: 5-10 minutes

---

## 🔧 Quick Fix Steps

### Step 1: Check Render Backend is Running ✓

```bash
# Test if backend is alive
curl https://isl-healthcare-connect-backend.onrender.com/api/health
```

**Expected response**:
```json
{"status":"ok","model_loaded":true,...}
```

**If NOT working**:
- Go to render.com → Your backend service
- Check status: Should be "Live" (green)
- Wait 30-60 seconds for cold start
- Watch "Logs" tab for errors
- If failing, manually deploy: "Manual Deploy" → Select commit → Deploy

---

### Step 2: Update Vercel Environment Variables

1. Go to **vercel.com** → Your Project → **Settings** → **Environment Variables**

2. **Add/Update these 3 variables**:

```
VITE_SUPABASE_URL
Value: https://nndjafynozneorhvpxvg.supabase.co
```

```
VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZGphZnlub3puZW9yaHZweHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgzMjMsImV4cCI6MjEwMjIxNDMyM30.MFA0pG6wXkAckMYHQb_ALOAjyuKkNfegTtsLwtnzaW8
```

```
VITE_API_URL
Value: https://isl-healthcare-connect-backend.onrender.com
```

3. Click "Save"

---

### Step 3: Redeploy Frontend

1. Go to **Vercel** → **Deployments** tab
2. Find the latest deployment (top)
3. Click the **"..."** menu → **"Redeploy"**
4. Wait 2-3 minutes

**Status indicator**:
- Blue = Building
- Green = Deployed
- Red = Failed

---

### Step 4: Test the Fix

**In Browser Console (F12)**:

```javascript
// Test Supabase connection
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)

// Test backend connection
fetch('https://isl-healthcare-connect-backend.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))
  .catch(e => console.error('Backend error:', e))
```

**Should see**:
- ✅ Supabase URL logged
- ✅ Backend JSON response
- ❌ NO CORS errors
- ❌ NO network errors

---

## 🐛 If Still Not Working

### Issue: "CORS error" in console

**Fix**:
1. Render → Your backend → Environment
2. Verify `ALLOWED_ORIGINS` includes Vercel URL:
   ```
   https://isl-healthcare-connect.vercel.app,https://*.vercel.app
   ```
3. Click "Save & Deploy"
4. Wait 5 minutes for rebuild

---

### Issue: Backend returns 503 error

**Cause**: Render free tier cold start (takes 30-60 sec)

**Fix**:
1. Wait 30-60 seconds
2. Accessing it wakes up the service
3. If persistent, check Render logs for errors

---

### Issue: "Cannot read properties" errors

**Cause**: Environment variables not loaded

**Fix**:
1. Verify all 3 variables added in Vercel
2. Redeploy: Deployments → Latest → Redeploy
3. Wait for green status
4. Refresh page (Ctrl+Shift+R)

---

## ✅ Verification Checklist

```
Environment Variables Set:
  ☐ VITE_SUPABASE_URL = https://nndjafynozneorhvpxvg.supabase.co
  ☐ VITE_SUPABASE_ANON_KEY = [long JWT string]
  ☐ VITE_API_URL = https://isl-healthcare-connect-backend.onrender.com

Vercel Deployment:
  ☐ Deployment shows "Green" status (live)
  ☐ No build errors in build logs
  ☐ Redeploy completed successfully

Render Backend:
  ☐ Service shows "Live" status
  ☐ /api/health endpoint responds
  ☐ Logs show no errors

Browser Testing:
  ☐ Page loads (no blank/frozen)
  ☐ Console shows no red errors
  ☐ Supabase connects
  ☐ Backend responds
```

---

## 📱 What the App Should Show

**If working correctly**:
1. ISL Setu logo loads ✓
2. Navigation menu visible ✓
3. Login/Sign up form displays ✓
4. No console errors ✓
5. Can click buttons (responsive) ✓

**If not working**:
1. Blank white page ✗
2. "This page isn't responding" ✗
3. Console has red error messages ✗

---

## 🔍 Debugging Steps (If Still Failing)

### 1. Check Vercel Build Logs
- Vercel → Deployments → Latest → Click deployment
- View "Build logs" tab
- Look for build errors

### 2. Check Render Service Logs
- Render → Your backend → Logs tab
- Look for startup errors
- Verify model loaded message

### 3. Check Browser Console (F12)
- Look for red error messages
- Check Network tab for failed requests
- Look for CORS errors

### 4. Test Backend Directly
```bash
# In terminal or Postman
curl -v https://isl-healthcare-connect-backend.onrender.com/api/health
```

---

## 🔄 Quick Deploy Flow

```
1. Update .env file (✓ Already done)
   └─ Added VITE_API_URL

2. Add environment variables in Vercel
   └─ 3 VITE_* variables

3. Redeploy from Vercel dashboard
   └─ Click Redeploy button

4. Wait for build (2-3 minutes)
   └─ Watch for green status

5. Test in browser
   └─ Should work now!
```

---

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Update Vercel env vars | 2 min | Manual |
| Redeploy | 3 min | Auto |
| Wait for live | 1 min | Auto |
| Test & verify | 2 min | Manual |
| **Total** | **8 min** | Ready! |

---

## ✨ After It Works

### Auto-Deploy Going Forward
```bash
git add .env
git commit -m "fix: add VITE_API_URL environment variable"
git push origin main
```

- Vercel auto-deploys in 2-3 minutes ✓
- No manual redeploy needed next time ✓

---

## 💡 Common Questions

**Q: Why is Render slow?**  
A: Free tier has cold starts. Accessing it wakes it up. First request takes 30-60s.

**Q: Do I need to restart anything?**  
A: No. Just redeploy from Vercel dashboard.

**Q: Why does it need VITE_API_URL?**  
A: Frontend needs to know backend URL. Without it, API calls fail.

**Q: Can I use localhost?**  
A: No. Frontend on Vercel can't reach localhost. Must use Render URL.

---

## 🎯 Next Steps

1. ✅ Added VITE_API_URL to .env (already done)
2. → Add 3 environment variables to Vercel
3. → Redeploy from Vercel dashboard
4. → Test in browser
5. → Should work!

---

**Need help? Check**:
- [VERCEL_RENDER_DEPLOYMENT.md](VERCEL_RENDER_DEPLOYMENT.md) - Full guide
- [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md) - Quick reference

---

**Fix estimated**: 5-10 minutes ✓
