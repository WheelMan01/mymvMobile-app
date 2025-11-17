# CORRECT DATABASE URL - DO NOT CHANGE

## ⚠️ CRITICAL INFORMATION

**The ONLY correct working database URL is:**

```
https://autospecs.preview.emergentagent.com
```

**DELETE AND NEVER USE:**
- ❌ https://autospecs.preview.emergentagent.com
- ❌ https://autospecs.preview.emergentagent.com
- ❌ https://autospecs.preview.emergentagent.com

## Testing Proof:

✅ **carmgmt-hub** - WORKS (returns valid login token)
❌ **mymv-api-docs** - FAILS (404 page not found)

## Files that must have this URL:

1. `/app/frontend/.env`
   - `EXPO_PUBLIC_BACKEND_URL=https://autospecs.preview.emergentagent.com`

2. `/app/frontend/backend-config.json`
   - `"backendUrl": null` (uses .env)

3. `/app/frontend/services/logoService.ts`
   - Fallback: `https://autospecs.preview.emergentagent.com`

## If login doesn't work:

1. Check all 3 files above
2. Clear Metro cache: `rm -rf /app/frontend/.metro-cache`
3. Restart expo: `sudo supervisorctl restart expo`
4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## Login Credentials:

- Email: anthony@wheelsfinance.com.au
- PIN: 1234

**NEVER change this URL to mymv-api-docs - it does not exist!**
