# 🔴 CRITICAL CONFIGURATION - READ THIS FIRST 🔴

## YOUR PRODUCTION BACKEND URL

```
⚠️ IF YOU CHANGE THIS URL, YOU WILL LOSE ALL YOUR DATA! ⚠️

Backend URL: https://apicache-fix.preview.emergentagent.com
Database: mongodb://localhost:27017/mymv_db
```

---

## What's Stored Here:
- ✅ All user accounts & authentication
- ✅ 3+ Vehicles (BMW M4, Toyota Camry, etc.)
- ✅ 3+ Insurance policies
- ✅ 3+ Roadside assistance services
- ✅ Finance/Loans data
- ✅ Service bookings
- ✅ Promotions data

---

## Where This URL is Configured:

### 1. Primary Config (MOST IMPORTANT):
**File:** `/app/frontend/backend-config.json`
```json
{
  "backendUrl": "https://apicache-fix.preview.emergentagent.com",
  "description": "PERMANENT BACKEND URL"
}
```

### 2. Environment File (Gets reset on fork):
**File:** `/app/frontend/.env`
```
EXPO_PUBLIC_BACKEND_URL=https://apicache-fix.preview.emergentagent.com
```

---

## ⚠️ After Every Fork:

**STEP 1: Verify backend-config.json**
```bash
cat /app/frontend/backend-config.json
```
**Expected output:**
```json
{
  "backendUrl": "https://apicache-fix.preview.emergentagent.com",
  ...
}
```

**STEP 2: If URL is wrong, fix it:**
```bash
# Update the file with correct URL
nano /app/frontend/backend-config.json

# Then restart
cd /app/frontend
rm -rf .metro-cache .expo node_modules/.cache
sudo supervisorctl restart expo
```

---

## 🧪 How to Test Connection:

```bash
# Test login
curl -X POST https://apicache-fix.preview.emergentagent.com/api/auth/pin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"anthony@wheelsfinance.com.au","pin":"1234"}'

# Should return: { "access_token": "...", "user": {...} }
```

---

## 📞 Emergency Recovery:

If you ever see:
- "No vehicles" when you should have 3+
- "Login failed" or 404 errors
- Empty dashboard

**FIX:**
1. Check `/app/frontend/backend-config.json` has the correct URL above
2. Clear cache: `rm -rf /app/frontend/.metro-cache`
3. Restart: `sudo supervisorctl restart expo`
4. Hard refresh browser: Ctrl+Shift+R

---

## 🔒 NEVER DELETE THIS FILE!

This file exists as a backup reference. The actual configuration is in:
- `/app/frontend/backend-config.json` (PRIMARY)
- `/app/FORK-PROTECTION-README.md` (BACKUP DOCS)
- `/app/CRITICAL-BACKEND-URL-DO-NOT-LOSE.md` (THIS FILE)

---

**Last Updated:** 2025-01-XX
**Verified Working:** ✅ YES
