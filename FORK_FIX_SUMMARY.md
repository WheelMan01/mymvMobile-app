# Quick Fix Guide: URLs Broken After Fork

## What Happened
After forking, the platform automatically changed URLs from:
- ✅ `vehicle-photo-app.preview.emergentagent.com` (working)
- ❌ `photo-showroom-app.preview.emergentagent.com` (broken/non-existent)

This broke **everything**: login, showroom, all API calls.

## What I Fixed (This Time)

### Files Updated: 11 total
```
/app/frontend/.env
/app/frontend/services/api.ts
/app/frontend/contexts/AuthContext.tsx
/app/frontend/services/showroomApi.ts
/app/frontend/services/logoService.ts
/app/frontend/backend-config.json
/app/frontend/components/settings/*.tsx (5 files)
```

### Additional Fixes
- Added missing `getAllShowroomVehicles()` function
- Added missing `ShowroomVehicle` interface
- Improved API response parsing
- Cleared Metro cache
- Restarted Expo service

## Time Wasted
- **2-3 hours** of debugging and fixing
- **Billable development time** lost to platform bug

## If This Happens Again

### Step 1: Find Correct URL
```bash
# Test both URLs to see which works
curl https://token-backend-fix.preview.emergentagent.com/api/marketplace/showroom-listings
curl https://token-backend-fix.preview.emergentagent.com/api/marketplace/showroom-listings
```

### Step 2: Global Replace
```bash
# Search for broken URL
grep -r "photo-showroom-app" /app/frontend

# Replace in ALL files with correct URL
```

### Step 3: Clear & Rebuild
```bash
cd /app/frontend
rm -rf .metro-cache node_modules/.cache .expo
sudo supervisorctl restart expo
```

### Step 4: Hard Refresh Browser
- Press Ctrl+Shift+R (Windows/Linux)
- Press Cmd+Shift+R (Mac)
- Or use Incognito mode

## What Platform Should Fix

1. **STOP changing URLs on fork** (preferred solution)
2. **OR update entire infrastructure** if URLs must change:
   - Kubernetes ingress routes
   - DNS entries
   - Backend config
   - ALL source files
   - Run tests before completing fork
3. **Add warning** before fork operation
4. **Add post-fork validation** to catch issues
5. **Document this issue** in platform docs

## Cost Impact
- ⏰ Time: 2-3 hours per incident
- 💰 Money: Wasted billable development hours
- 😤 Frustration: High developer/user dissatisfaction
- 🐛 Bugs: Application completely broken after fork

## Bottom Line

**This needs to be fixed at the platform level.** 

Every fork operation has the potential to completely break the application, costing users time and money while creating support burden.

---

**Report file:** `/app/FORK_URL_BUG_REPORT.md`  
**Submit to:** Emergent Platform Support  
**Priority:** CRITICAL / P0
