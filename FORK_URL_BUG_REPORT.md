# CRITICAL BUG REPORT: Fork Operation Breaks Application URLs

## Executive Summary
**Severity:** CRITICAL  
**Impact:** Complete application failure after fork operation  
**User Impact:** 100% - Application becomes completely non-functional  
**Financial Impact:** Billable time wasted, development velocity blocked  

---

## Problem Description

When a project is forked in the Emergent platform, the system automatically changes ALL API URLs throughout the codebase from the original working URL to a new, incorrect URL. This causes:

1. **Complete login failure** (404 errors)
2. **Empty/broken features** (showroom, vehicle data, etc.)
3. **Total application malfunction**
4. **Wasted developer time** debugging what appears to be code issues

### Example of What Happens

**Before Fork (Working):**
```
API URL: https://apicache-fix.preview.emergentagent.com
```

**After Fork (Broken):**
```
API URL: https://apicache-fix.preview.emergentagent.com
```

The new URL (`photo-showroom-app`) **does not exist** and returns 404 errors for all API calls.

---

## Root Cause Analysis

### What the Fork Operation Does (Incorrectly)

1. **Overwrites .env files** with new URLs
2. **Modifies hardcoded URLs** in source code
3. **Changes URLs inconsistently** across files
4. **Does NOT update backend/database URLs** to match
5. **Creates URL mismatch** between frontend, backend, and infrastructure

### Affected Files in This Incident

The following **11 files** were incorrectly modified during fork:

```
/app/frontend/.env
/app/frontend/services/api.ts
/app/frontend/contexts/AuthContext.tsx
/app/frontend/services/showroomApi.ts
/app/frontend/services/logoService.ts
/app/frontend/backend-config.json
/app/frontend/components/settings/AccountTab.tsx
/app/frontend/components/settings/SecurityTab.tsx
/app/frontend/components/settings/NotificationsTab.tsx
/app/frontend/components/settings/BillingTab.tsx
/app/frontend/components/settings/TransfersTab.tsx
```

### What Should Have Happened

1. **URLs should remain unchanged** OR
2. **If URLs must change, the entire infrastructure should be updated together** including:
   - Frontend environment variables
   - Backend configuration
   - Database connections
   - Kubernetes ingress rules
   - All service endpoints

---

## Technical Impact

### 1. Authentication Completely Broken
```javascript
// Frontend tries to call:
POST https://apicache-fix.preview.emergentagent.com/api/auth/login

// But the actual working endpoint is:
POST https://apicache-fix.preview.emergentagent.com/api/auth/login

// Result: 404 Not Found - Users cannot log in
```

### 2. All API Calls Fail
- Vehicle data: 404
- Showroom listings: 404
- Photo uploads: 404
- User settings: 404
- Every single feature: BROKEN

### 3. Misleading Error Messages
Developers see errors that suggest:
- "Network error"
- "CORS issues"
- "Authentication failed"

But the **real problem** is the URLs point to non-existent endpoints.

### 4. Development Time Wasted

**This incident alone required:**
- 1+ hour of debugging
- Multiple agent calls (troubleshooting, testing)
- Complete URL audit across entire codebase
- Manual find-and-replace across 11 files
- Cache clearing and rebuilds
- User frustration and confusion

**Estimated cost:** 2-3 billable hours + user frustration

---

## Required Fix Steps (Manual Workaround)

Until this is fixed at the platform level, developers must:

### Step 1: Identify the Correct URL
```bash
# Test which URL actually works
curl https://apicache-fix.preview.emergentagent.com/api/marketplace/showroom-listings
curl https://apicache-fix.preview.emergentagent.com/api/marketplace/showroom-listings

# One will return data (200), one will fail (404)
```

### Step 2: Global Search and Replace

Search for **ALL instances** of the incorrect URL and replace:

```bash
# Example using grep
grep -r "photo-showroom-app" /app/frontend --include="*.ts" --include="*.tsx" --include="*.json" --include=".env"

# Replace with correct URL in ALL files
```

### Step 3: Update Critical Files

**Environment Variables:**
```bash
# /app/frontend/.env
EXPO_TUNNEL_SUBDOMAIN=vehicle-photo-app
EXPO_PACKAGER_HOSTNAME=https://apicache-fix.preview.emergentagent.com
EXPO_PUBLIC_BACKEND_URL=https://apicache-fix.preview.emergentagent.com
```

**API Services:**
```typescript
// /app/frontend/services/api.ts
const API_URL = 'https://apicache-fix.preview.emergentagent.com';
```

**All other files** - repeat for each affected file

### Step 4: Clear Caches and Rebuild

```bash
# Clear Metro bundler cache
cd /app/frontend
rm -rf .metro-cache node_modules/.cache .expo

# Restart Expo service
sudo supervisorctl restart expo

# Wait for rebuild (20-30 seconds)
```

### Step 5: Verify Fix

```bash
# Check new build is using correct URL
tail -100 /var/log/supervisor/expo.out.log | grep "API_URL"

# Should show: https://apicache-fix.preview.emergentagent.com
```

### Step 6: Hard Refresh Browser

Users MUST clear browser cache or use incognito mode, as browsers cache the old (broken) URLs.

---

## Recommended Platform Fixes

### Priority 1: STOP Modifying URLs on Fork

**DO NOT change URLs automatically during fork operation.**

URLs are not just configuration - they are:
- Infrastructure endpoints
- Kubernetes ingress routes
- DNS entries
- Service discovery paths

Changing them breaks the entire application architecture.

### Priority 2: If URLs MUST Change, Update Infrastructure

If URL changes are unavoidable, the fork operation must:

1. **Update Kubernetes ingress** to route new URLs
2. **Update DNS/service discovery**
3. **Update backend configuration** to match frontend
4. **Update database connection strings**
5. **Update ALL source files** consistently
6. **Run smoke tests** to verify nothing broke
7. **FAIL the fork operation** if any step fails

### Priority 3: Add Fork Pre-Flight Check

Before forking:
```
1. Detect all URL patterns in codebase
2. Ask user: "URLs will change from X to Y. Continue?"
3. Show list of affected files
4. Require explicit confirmation
5. Provide rollback option
```

### Priority 4: Post-Fork Validation

After forking:
```
1. Run automated tests
2. Verify all API endpoints respond (200 OK)
3. Check authentication flow works
4. Test critical user journeys
5. Alert user if ANY test fails
6. Provide one-click rollback
```

### Priority 5: Documentation

Add to platform documentation:
```
⚠️ WARNING: Forking may change application URLs

After forking, you may need to:
1. Verify your application URLs are correct
2. Update environment variables if needed
3. Clear browser cache
4. Rebuild your application

If you experience 404 errors after forking, check [URL Fix Guide]
```

---

## Prevention Checklist

To prevent this issue in future:

- [ ] Fork operation preserves URLs by default
- [ ] If URLs change, entire stack is updated atomically
- [ ] Automated tests run after fork
- [ ] User is warned before URL changes
- [ ] Rollback mechanism is available
- [ ] Documentation includes fork troubleshooting
- [ ] Support team is trained on this issue
- [ ] Platform monitors for "fork + 404" patterns

---

## Business Impact

### Current State
- **Every fork** has potential to completely break the application
- **Users waste hours** debugging what appears to be code issues
- **Support tickets increase** from confused developers
- **Platform reputation suffers** from "unreliable forks"
- **Development velocity drops** due to manual fixes

### After Fix
- Forks work reliably
- Developers trust the platform
- Support tickets decrease
- Development velocity increases
- User satisfaction improves

---

## Reproduction Steps

To reproduce this bug:

1. Create any working Expo + FastAPI application
2. Ensure application is functioning with correct URLs
3. Fork the application
4. Observe: All URLs are changed to incorrect values
5. Test login: Fails with 404
6. Test any API call: Fails with 404
7. Application is completely broken

**Expected:** Application should work after fork  
**Actual:** Application completely fails after fork

---

## Files Modified to Fix This Instance

```diff
Files fixed (all had incorrect URLs after fork):

+ /app/frontend/.env
+ /app/frontend/services/api.ts
+ /app/frontend/contexts/AuthContext.tsx
+ /app/frontend/services/showroomApi.ts
+ /app/frontend/services/logoService.ts
+ /app/frontend/backend-config.json
+ /app/frontend/components/settings/AccountTab.tsx
+ /app/frontend/components/settings/SecurityTab.tsx
+ /app/frontend/components/settings/NotificationsTab.tsx
+ /app/frontend/components/settings/BillingTab.tsx
+ /app/frontend/components/settings/TransfersTab.tsx
```

Total: **11 files** required manual correction

---

## Verification Commands

To verify the fix:

```bash
# 1. Check no broken URLs remain
grep -r "photo-showroom-app" /app/frontend --include="*.ts" --include="*.tsx" --include="*.json" --include=".env"
# Should return: no results

# 2. Check correct URLs are in place
grep -r "vehicle-photo-app" /app/frontend --include="*.ts" --include="*.tsx" --include="*.json" --include=".env" | head -5
# Should show: vehicle-photo-app.preview.emergentagent.com

# 3. Test API endpoint
curl https://apicache-fix.preview.emergentagent.com/api/marketplace/showroom-listings
# Should return: 200 OK with JSON data

# 4. Check build logs
tail -100 /var/log/supervisor/expo.out.log | grep "API_URL"
# Should show: vehicle-photo-app (not photo-showroom-app)
```

---

## Support Contact Information

**Issue reported by:** User (via AI agent)  
**Date:** 2025-11-14  
**Project affected:** vehicle-photo-app  
**Fork operation:** Resulted in complete application failure  
**Time to fix:** 2-3 hours of billable development time  

---

## Conclusion

This is a **critical platform bug** that makes forking unreliable and wastes significant development time. The issue needs to be fixed at the platform level to prevent future occurrences.

**Recommendation:** Treat this as P0/Critical priority given its impact on user experience and development velocity.

---

## Appendix: Full Error Log Sample

```
Frontend attempting call:
POST https://apicache-fix.preview.emergentagent.com/api/auth/login

Backend running at:
https://apicache-fix.preview.emergentagent.com

Result:
- Status: 404 Not Found
- Error: Cannot connect to API
- User impact: Cannot log in, cannot use any features
- Developer sees: "Network error" (misleading)
- Actual cause: URLs were changed by fork operation
```
