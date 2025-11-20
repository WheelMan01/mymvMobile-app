# Backend Configuration

## CRITICAL: Do Not Modify Backend URL

This mobile app connects to a SHARED backend managed in a separate workspace.

**Backend API URL:** `https://fork-safe-auth.preview.emergentagent.com`

**Database:** MongoDB `mymv_db` (shared with web app)

## Why This Configuration?

- The backend and database are managed in the web workspace (Job: 961c0d08...)
- This mobile app acts as a CLIENT consuming that API
- Both web and mobile apps share the same data
- Changes to backend affect both apps simultaneously

## Architecture

```
┌─────────────────────────────────────────────┐
│  Web Workspace (Job: 961c0d08...)          │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Web App       │  │  FastAPI Backend │ │
│  │   (React)       │  │                  │ │
│  └────────┬────────┘  └────────┬─────────┘ │
│           │                    │           │
│           └────────────┬───────┘           │
│                        │                   │
│                  ┌─────▼──────┐            │
│                  │  MongoDB   │            │
│                  │  mymv_db   │            │
│                  └─────▲──────┘            │
└────────────────────────┼───────────────────┘
                         │
          https://fork-safe-auth.preview.emergentagent.com
                         │
┌────────────────────────┼───────────────────┐
│  Mobile Workspace (Job: 32454883...)       │
│                  ┌─────▼──────┐            │
│                  │ Mobile App │            │
│                  │ (React     │            │
│                  │  Native)   │            │
│                  └────────────┘            │
└────────────────────────────────────────────┘
```

## If You Need to Change Backend URL

**DO NOT** change the URL in code files directly.

Contact the web workspace developer first. If backend URL must change:

1. Update `/app/frontend/services/api.ts` - line with `export const API_URL`
2. Search entire codebase for old URL and replace
3. Clear cache: `rm -rf .expo .metro-cache node_modules/.cache && sudo supervisorctl restart expo`
4. Commit changes to git
5. Test login and data sync

## Verification

To verify correct backend URL is being used:

1. Check console logs on app startup
2. Should see: 
   ```
   🔗 Mobile App Backend URL: https://fork-safe-auth.preview.emergentagent.com
   ✅ Connected to shared backend (web workspace)
   ```
3. Test cross-platform sync: Add vehicle on mobile → should appear on web

## Troubleshooting

### Mobile app can't connect to backend

**Check:**
- Verify URL is exactly: `https://fork-safe-auth.preview.emergentagent.com`
- Check internet connection
- Verify backend is running (ask web workspace developer)
- Clear cache: `rm -rf .expo .metro-cache && sudo supervisorctl restart expo`

### Data not syncing between mobile and web

**Check:**
- Both apps are using the same backend URL
- Authentication is working (check auth token)
- No API errors in console

### After forking, login stops working

This is expected! The fork creates new backend URLs. Follow these steps:

1. **Verify configuration files:**
   ```bash
   grep -r "mobile-backend-sync\|photo-showroom" /app/frontend/services/
   # Should return NOTHING
   
   grep "API_URL" /app/frontend/services/api.ts
   # Should show: https://fork-safe-auth.preview.emergentagent.com
   ```

2. **If wrong URL is found, update it:**
   ```bash
   # Update api.ts
   # Update showroomApi.ts
   # Update any other service files
   ```

3. **Clear aggressive cache:**
   ```bash
   sudo supervisorctl stop expo
   cd /app/frontend
   rm -rf .expo .metro-cache node_modules/.cache /tmp/metro-* /tmp/haste-*
   sudo supervisorctl start expo
   ```

4. **Wait 15-20 seconds for Metro to bundle**

5. **Verify logs:**
   ```bash
   tail -50 /var/log/supervisor/expo.out.log | grep "Mobile App Backend URL"
   # Should show correct URL
   ```

## Files That Use API_URL

All these files import from centralized `/app/frontend/services/api.ts`:

- ✅ `services/api.ts` - **MASTER source of truth**
- ✅ `services/showroomApi.ts`
- ✅ `contexts/AuthContext.tsx`
- ✅ `services/logoService.ts`
- ✅ `components/settings/AccountTab.tsx`
- ✅ `components/settings/NotificationsTab.tsx`
- ✅ `components/settings/BillingTab.tsx`
- ✅ `components/settings/TransfersTab.tsx`
- ✅ `components/settings/SecurityTab.tsx`

**NEVER hardcode URLs in these files!** Always import:
```typescript
import { API_URL } from '../services/api';
```

## Environment Variables

The `.env` file may contain:
```env
# SHARED BACKEND API
# DO NOT MODIFY - This connects to web workspace backend
EXPO_PUBLIC_API_URL=https://fork-safe-auth.preview.emergentagent.com
```

However, the code uses the value from `services/api.ts`, not `.env`, to avoid fork-related URL changes.

## Git Commits

This configuration is committed to git to ensure persistence:
- Configuration files are version-controlled
- After fork, git history contains correct URLs
- Can always revert to working state

## DO NOT Change Backend URL Without Coordination

Changing the backend URL breaks the connection between mobile and web apps!

**Contact web workspace developer (Job: 961c0d08...) if:**
- Backend URL needs to change
- API endpoints are not responding  
- Data is not syncing between web and mobile
- Authentication is failing
- Any backend-related issues

---

**Last Updated:** 2025-06-19 (after fork configuration fix)
**Backend URL:** `https://fork-safe-auth.preview.emergentagent.com`
**Status:** ✅ Working and configured for persistence
