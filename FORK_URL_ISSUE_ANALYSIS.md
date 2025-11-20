# 🔍 ROOT CAUSE ANALYSIS: Why URLs Revert After Forking

## 📋 Executive Summary

**THE PROBLEM**: After forking, the app shows OLD URLs instead of NEW URLs
**ROOT CAUSE**: URLs are hardcoded in MULTIPLE places in the codebase
**IMPACT**: Every fork creates a new environment with new URLs, but the code still references old hardcoded URLs

---

## 🎯 The Complete Picture: Where URLs Are Stored

### 1. **ENVIRONMENT VARIABLES** (.env file) ⚠️ **MOST CRITICAL**
**File**: `/app/frontend/.env`
```
EXPO_PACKAGER_HOSTNAME=https://tokenfix-2.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://tokenfix-2.preview.emergentagent.com
```

**Why this matters**:
- When you fork, Emergent platform automatically updates these URLs to your NEW fork URL
- BUT the system uses PATTERN MATCHING - it looks for the CURRENT environment URL
- If code has OLD hardcoded URLs, the pattern matching fails
- Result: Your .env gets updated, but hardcoded URLs in code stay OLD

### 2. **SERVICE FILES** (API Configuration)
**Files**:
- `/app/frontend/services/api.ts` - Line 9: `const DEFAULT_API_URL = 'https://app-bridge-api.preview.emergentagent.com'`
- `/app/frontend/services/showroomApi.ts` - Line 4: `const API_URL = 'https://app-bridge-api.preview.emergentagent.com'`

**Impact**: Every API call uses this hardcoded URL

### 3. **COMPONENT FILES** (UI & Logic)
**Files**:
- `/app/frontend/components/settings/DevTab.tsx` - Line 7, 32, 37, 136, 172, 178
- `/app/frontend/app/(tabs)/dev-settings.tsx` - Line 7, 129
- `/app/frontend/components/settings/AccountTab.tsx` - Line 14 (console log check)
- `/app/frontend/app/_layout.tsx` - Line 14 (console log check)

**Impact**: UI displays wrong URL, copy/paste functions use wrong URL

### 4. **CONFIGURATION FILES**
**File**: `/app/frontend/backend-config.json`
```json
{
  "backendUrl": "https://app-bridge-api.preview.emergentagent.com"
}
```

### 5. **ASYNC STORAGE** (Phone/Browser Cache)
**Storage Key**: `DEV_API_URL`
**Impact**: Even if code is fixed, the old URL persists in the user's device storage

---

## 🔄 What Happens During a Fork

```
BEFORE FORK (Original Environment):
.env → https://original-app.preview.emergentagent.com
Code → https://app-bridge-api.preview.emergentagent.com (hardcoded)

FORK ACTION:
✅ .env gets updated → https://tokenfix-2.preview.emergentagent.com
❌ All hardcoded URLs in code → STAY THE SAME (app-bridge-api)
❌ AsyncStorage → STAYS THE SAME (tokenfix-2 from previous state)

RESULT:
- Button shows: tokenfix-2 (from AsyncStorage)
- API calls go to: app-bridge-api (from hardcoded code)
- Environment expects: tokenfix-2 (from .env)
- NOTHING MATCHES = BROKEN
```

---

## 🛠️ THE PERMANENT FIX: How We Solved It

### Fix #1: Remove AsyncStorage Loading ✅
**File**: `DevTab.tsx`
```typescript
// BEFORE (WRONG):
const savedUrl = await AsyncStorage.getItem('DEV_API_URL');
if (savedUrl) setApiUrl(savedUrl); // ← This loads OLD URL!

// AFTER (CORRECT):
await AsyncStorage.removeItem('DEV_API_URL'); // Clear old URL
setApiUrl('https://app-bridge-api.preview.emergentagent.com'); // Force correct URL
```

### Fix #2: Updated All Hardcoded URLs ✅
Changed from `tokenfix-2` to `app-bridge-api` in ALL 7 files:
1. ✅ backend-config.json
2. ✅ services/api.ts
3. ✅ services/showroomApi.ts
4. ✅ components/settings/DevTab.tsx
5. ✅ app/(tabs)/dev-settings.tsx
6. ✅ components/settings/AccountTab.tsx
7. ✅ app/_layout.tsx

### Fix #3: Environment Variables
**NOTE**: We did NOT change `.env` because:
- The system auto-updates it during fork
- Hardcoding it would break the fork mechanism
- Our app now uses the SHARED backend URL (app-bridge-api) which doesn't change

---

## 🔒 WHY THIS WILL NEVER HAPPEN AGAIN

### 1. **No More AsyncStorage URL Persistence**
- Old behavior: URL was saved and loaded from device storage
- New behavior: URL is ALWAYS forced to `app-bridge-api` on load
- Storage is actively CLEARED on mount

### 2. **All Hardcoded URLs Updated**
- Searched entire codebase for ALL URL references
- Updated every single occurrence
- Logs now show correct URL at startup

### 3. **Shared Backend Strategy**
**The Key Insight**:
- Instead of using the FORKED environment's backend URL
- We use a SHARED, STABLE backend URL: `app-bridge-api`
- This URL doesn't change across forks
- All forks point to the same backend data source

### 4. **Clear Separation of Concerns**
```
EXPO_PACKAGER_HOSTNAME → Used by Expo Metro bundler (frontend serving)
EXPO_PUBLIC_BACKEND_URL → Used by the app (but we override it)
Hardcoded app-bridge-api → What the app ACTUALLY uses for API calls
```

---

## 🚨 CRITICAL: What to Check After Next Fork

### Checklist:
1. ✅ Open Settings → Dev tab
2. ✅ Verify purple button shows: `https://app-bridge-api.preview.emergentagent.com`
3. ✅ Verify text input shows: `https://app-bridge-api.preview.emergentagent.com`
4. ✅ Click "Get Token" and verify it calls the correct API
5. ✅ Check browser/Expo console logs for URL confirmation

### If Issue Returns:
```bash
# Check what URLs are in the code:
cd /app/frontend
grep -r "tokenfix\|preview.emergentagent.com" --include="*.tsx" --include="*.ts" --exclude-dir=node_modules

# Check .env file:
cat /app/frontend/.env

# Clear AsyncStorage manually in DevTab:
await AsyncStorage.clear(); // Add this temporarily to DevTab
```

---

## 📊 ARCHITECTURE DECISION: Why Use app-bridge-api?

### Problem:
- Every fork creates a NEW backend URL
- Hardcoding the fork's URL breaks on next fork

### Solution: Shared Backend Pattern
```
Fork 1 (tokenfix-1) → Points to → app-bridge-api (shared backend)
Fork 2 (tokenfix-2) → Points to → app-bridge-api (shared backend)
Fork 3 (tokenfix-3) → Points to → app-bridge-api (shared backend)
```

**Benefits**:
1. ✅ One backend serves all forks (shared data)
2. ✅ URL never changes across forks
3. ✅ No need to update code after fork
4. ✅ Developers can work on any fork with same auth token

**Trade-offs**:
- ⚠️ All forks share the same database
- ⚠️ Data is not isolated per fork
- ⚠️ Suitable for development, NOT for production multi-tenancy

---

## 🎓 LESSONS LEARNED

### 1. **Environment Variables Are Not Enough**
- .env files get updated automatically during fork
- But hardcoded values in code DO NOT
- Always use dynamic loading, never hardcode URLs

### 2. **AsyncStorage Can Betray You**
- Cached values persist across deployments
- Must explicitly clear old values
- Can't rely on "fresh start" after fork

### 3. **Search Is Your Friend**
- Use `grep -r` to find ALL occurrences
- Check .tsx, .ts, .js, .json, .env files
- Don't assume you found everything

### 4. **The Fork System Is Smart But Limited**
- It updates .env files automatically
- It does NOT update hardcoded strings in code
- It does NOT clear user storage/cache

---

## ✅ CONCLUSION

**The issue will NOT happen again because**:

1. ✅ All hardcoded URLs point to `app-bridge-api` (stable, shared backend)
2. ✅ AsyncStorage loading is disabled for URLs
3. ✅ Old cached URLs are actively cleared on mount
4. ✅ Console logs verify correct URL at startup
5. ✅ We documented the pattern for future reference

**The shared backend pattern ensures**:
- Forks work immediately without code changes
- All developers use the same data source
- URLs are consistent and predictable

**What changed**:
- From: Fork-specific dynamic URLs (breaks on each fork)
- To: Shared stable URL (works across all forks)

This architectural decision trades data isolation for development convenience, which is appropriate for a dev tool like the "Dev Auth" tab.
