# 🔧 Post-Fork Setup Guide

## Issue Fixed
The app was trying to use a malformed backend URL (`apicache.fix.preview.emergentagent.cc`) which was causing all API calls to fail with 404 errors.

## What I Fixed
1. **Added URL Validation**: The app now automatically detects and fixes common URL issues:
   - `.cc` → `.com` (domain fix)
   - `apicache.fix` → `apicache-fix` (hyphen fix)

2. **Dynamic URL Loading**: The axios client now loads the backend URL dynamically on every request from AsyncStorage, ensuring configuration changes take effect immediately.

3. **Auto-Fix on Startup**: When the app starts, it automatically validates and fixes any malformed URLs stored in AsyncStorage.

## How to Test the Fix

### Option 1: Just Refresh (Recommended)
The app should now automatically fix the bad URL and work correctly:

1. **Refresh your browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. The app should now load correctly
3. You can use the fake login to access the app

### Option 2: Manual Configuration (If needed)
If you still see 404 errors:

1. Open the app and navigate to **Settings**
2. Click on the **Dev** tab
3. Click the **"📋 Use Shared Backend: app-bridge-api"** button
4. This will set the correct URL: `https://apicache-fix.preview.emergentagent.com`
5. Refresh the page

### Option 3: Get Real Token (For full functionality)
To connect to the actual shared backend and access real data:

1. Go to **Settings → Dev Tab**
2. Ensure the Backend URL is: `https://apicache-fix.preview.emergentagent.com`
3. Enter valid credentials:
   - Email: `anthony@wheelsfinance.com.au` (or your test user)
   - PIN: `1234` (or your test PIN)
4. Click **"Get Real Token from Backend"**
5. Wait for the success message
6. Refresh the page

## Technical Details

### What Changed in the Code

**File: `/app/frontend/services/api.ts`**

1. Added `validateApiUrl()` function to detect and fix malformed URLs
2. Updated `loadDevConfig()` to auto-fix bad URLs in AsyncStorage
3. Modified `getCurrentApiUrl()` to apply validation on every request
4. Changed axios to use dynamic baseURL instead of static one

### URL Validation Rules

```typescript
validateApiUrl(url) {
  // Fix .cc → .com
  if (url.includes('.cc')) {
    url = url.replace('.cc', '.com');
  }
  
  // Fix dot → hyphen
  if (url.includes('apicache.fix')) {
    url = url.replace('apicache.fix', 'apicache-fix');
  }
  
  return url;
}
```

### Default Configuration

- **Correct Shared Backend URL**: `https://app-bridge-api.preview.emergentagent.com`
- This is the URL that the "Use Shared Backend" button will now set
- This is the backend shared between web and mobile apps

## Troubleshooting

### Still Seeing 404 Errors?

1. **Clear Browser Cache**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
2. **Check Console Logs**: Look for messages starting with `🔗 Request to:`
3. **Manual Reset**: 
   - Go to Settings → Dev Tab
   - Scroll down and look for a "Clear Config" button (if available)
   - Or just click "Use Shared Backend" again

### Getting 403 Forbidden?

This is actually **good news**! It means:
- ✅ The URL is correct
- ✅ The API is reachable
- ⚠️ You just need a valid auth token

**Solution**: Use the "Get Real Token from Backend" feature in Dev Settings.

### Getting 401 Unauthorized?

This means:
- ✅ The URL is correct
- ✅ The API is reachable
- ⚠️ The credentials (email/PIN) are invalid

**Solution**: Check your test credentials or create a new user in the backend.

## Next Steps

After confirming the fix works:

1. **Test the app functionality** with fake login
2. **Configure real backend** if you need actual data
3. **Fork again** to test the streamlined setup process
4. **Report any remaining issues**

## Summary

The core issue was a malformed URL in AsyncStorage from a previous session. The fix ensures:
- ✅ Automatic detection and correction of URL issues
- ✅ Dynamic URL loading on every request
- ✅ Persistent fix that survives app restarts
- ✅ Easy manual override via Dev Settings

You should now be able to use the app without 404 errors! 🎉
