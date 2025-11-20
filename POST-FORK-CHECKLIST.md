# POST-FORK CHECKLIST
## Critical Steps After Forking This Project

⚠️ **IMPORTANT**: When this project is forked, the Emergent platform automatically creates new backend instances with different URLs. This checklist ensures the mobile app continues to work with the correct backend.

## Problem
After forking, the mobile app may fail to connect to the backend because:
1. Environment variables in `.env` files get automatically updated to new fork URLs
2. Metro bundler aggressively caches old code
3. Multiple configuration files need to be synchronized

## Solution

### Step 1: Verify Backend URL Configuration
The mobile app should connect to: **`https://tokenfix-2.preview.emergentagent.com`**

Check and update these files if needed:

1. **`/app/frontend/services/api.ts`** (MASTER SOURCE OF TRUTH)
   ```typescript
   export const API_URL = 'https://tokenfix-2.preview.emergentagent.com';
   ```

2. **`/app/frontend/services/showroomApi.ts`**
   ```typescript
   const API_URL = 'https://tokenfix-2.preview.emergentagent.com';
   ```

3. **`/app/frontend/backend-config.json`**
   ```json
   {
     "backendUrl": "https://tokenfix-2.preview.emergentagent.com",
     "apiPrefix": "/api"
   }
   ```

4. **`/app/frontend/contexts/AuthContext.tsx`**
   - Should import from `services/api`: `import { API_URL } from '../services/api';`
   - Should NOT have hardcoded URL

5. **All Settings Components** (`/app/frontend/components/settings/*.tsx`)
   - Should import from `services/api`: `import { API_URL } from '../../services/api';`
   - Should NOT have hardcoded URLs

### Step 2: Search for Hardcoded URLs
```bash
cd /app/frontend
grep -r "mobile-backend-sync" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
# Should return NO results

grep -r "app-bridge-api" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
# Should show only the centralized configuration files
```

### Step 3: Clear All Caches (CRITICAL!)
```bash
sudo supervisorctl stop expo
pkill -9 -f "expo start" || true
pkill -9 -f "metro" || true
cd /app/frontend
rm -rf .expo .metro-cache node_modules/.cache /tmp/metro-* /tmp/haste-* 2>/dev/null || true
```

### Step 4: Restart Expo
```bash
cd /app/frontend
export EXPO_NO_CACHE=1
sudo supervisorctl start expo
```

### Step 5: Verify the Fix
Wait 15-20 seconds for bundling, then check logs:
```bash
tail -150 /var/log/supervisor/expo.out.log | grep "AuthContext API_URL"
```

Should show:
```
🔧 AuthContext API_URL: https://tokenfix-2.preview.emergentagent.com
```

### Step 6: Test Login
1. Open the mobile preview
2. Try logging in with test credentials
3. Verify the app connects to the correct backend

## Database Information
- **Backend API**: `https://tokenfix-2.preview.emergentagent.com`
- **Database**: `mymv_db` (MongoDB)
- **Connection**: The backend connects to MongoDB at `mongodb://localhost:27017`

## Why This Happens
The Emergent platform's forking mechanism:
1. Creates isolated environments for each fork
2. Automatically generates new URLs for the forked backend
3. Updates `.env` files to point to the new instance
4. However, for this app, we WANT to keep using the ORIGINAL backend to maintain data consistency with the web app

## Files That Should NEVER Have Hardcoded URLs
- `/app/frontend/contexts/AuthContext.tsx`
- `/app/frontend/components/settings/AccountTab.tsx`
- `/app/frontend/components/settings/NotificationsTab.tsx`
- `/app/frontend/components/settings/BillingTab.tsx`
- `/app/frontend/components/settings/TransfersTab.tsx`
- `/app/frontend/components/settings/SecurityTab.tsx`
- `/app/frontend/services/logoService.ts`

All these files should import the centralized `API_URL` from `/app/frontend/services/api.ts`

## Troubleshooting

### Login Still Fails After Fix
1. Check browser console for network errors
2. Verify the API endpoint is reachable: `curl https://tokenfix-2.preview.emergentagent.com/api/health`
3. Check backend logs: `tail -50 /var/log/supervisor/backend.out.log`

### Old URL Still Shows in Logs
Metro bundler is serving cached code. Repeat Step 3 (Clear All Caches) more aggressively:
```bash
sudo supervisorctl stop expo
cd /app/frontend
rm -rf .expo .metro-cache node_modules/.cache
rm -rf .expo-shared
yarn cache clean
sudo supervisorctl start expo
```

### Changes Not Reflecting
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Use incognito/private browsing mode

---

**Last Updated**: After fork on 2025-06-19
**Verified Working**: Yes ✅
