# 🔧 Backend Not Responding - Quick Fix

**Issue**: Backend returns "404 Not Found"  
**Cause**: Render service may be spun down or not fully started  
**Solution**: Restart the Render service (2 minutes)

---

## ⚡ Quick Fix

### Step 1: Go to Render Dashboard
1. Visit: **dashboard.render.com**
2. Click your backend service: **isl-healthcare-connect-backend** (or similar name)
3. Go to the **"Logs"** tab

### Step 2: Check Service Status
Look for one of these:
- ✅ "Display succeeded • Live" (green) = Service is running
- ⚠️ "Spun down" or similar = Service is inactive
- ❌ Error messages in logs = Build or startup issue

### Step 3: Restart Service

**If status is "Spun down"**:
1. Go to **"Deploy"** tab
2. Click **"Manual Deploy"** on the latest commit
3. Wait 5-10 minutes for rebuild
4. Status should turn green: "Display succeeded • Live"

**If status shows error**:
1. Check logs for error messages
2. Common issues:
   - MediaPipe model not downloading (needs ~100MB)
   - Python dependency missing
   - Port binding issue
3. Contact support or check logs carefully

---

## 🧪 Test After Restart

Once service is green (Live), test:

```bash
# Test 1: Health endpoint
curl https://isl-healthcare-connect-backend.onrender.com/api/health

# Test 2: Get vocabulary
curl https://isl-healthcare-connect-backend.onrender.com/api/signs
```

Should return JSON response (not 404).

---

## ℹ️ Why Render Spins Down

Render's **free tier** automatically:
- Spins down after 15 minutes of inactivity
- Restarts on next request (takes 30-60 seconds)
- No cost, but has cold start delays

**Solution**: 
- Use "Starter" plan ($12/month) for always-on service
- Or accept the spin-down/startup delay

---

## 🎯 Permanent Fix

If you want faster performance, upgrade to Starter plan:

1. Render dashboard → Your service
2. Click **"Upgrade"** button
3. Select **"Starter"** plan ($12/month)
4. Benefits:
   - No spin-down
   - Always running
   - Faster responses

---

## 📋 Checklist

```
Service Status:
  ☐ Check service shows "Live" (green) in dashboard
  ☐ If not, click "Manual Deploy"
  ☐ Wait 5-10 minutes for rebuild
  
Health Endpoint:
  ☐ curl /api/health returns JSON (not 404)
  ☐ Check status: "ok"
  ☐ Check model_loaded: true

Frontend Connection:
  ☐ VITE_API_URL points to correct Render URL
  ☐ Vercel has been redeployed
  ☐ Frontend can reach backend (no CORS errors)
```

---

## 🚀 After Service Restarts

Your application will work:
1. Frontend at: https://isl-healthcare-connect.vercel.app ✓
2. Backend at: https://isl-healthcare-connect-backend.onrender.com ✓
3. Database at: Supabase ✓

---

**Do this now**: Go to Render → Check service status → Restart if needed → Test

If still having issues, check the backend logs for specific error messages.
