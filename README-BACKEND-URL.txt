╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         🔴 CRITICAL: YOUR PRODUCTION BACKEND URL 🔴           ║
║                                                                ║
║   Backend: https://api-bridge-dev.preview.emergentagent.com  ║
║   Database: mongodb://localhost:27017/mymv_db                  ║
║                                                                ║
║   ⚠️  DO NOT CHANGE OR YOU WILL LOSE ALL YOUR DATA! ⚠️       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📍 WHERE THIS IS CONFIGURED:

   1. /app/frontend/backend-config.json (PRIMARY - ACTIVE CONFIG)
   2. /app/frontend/.env (Gets reset on fork)
   3. /app/CRITICAL-BACKEND-URL-DO-NOT-LOSE.md (BACKUP REFERENCE)
   4. /app/FORK-PROTECTION-README.md (FULL DOCUMENTATION)

📊 DATA STORED ON THIS BACKEND:

   ✅ User Accounts & Authentication
   ✅ 3+ Vehicles (BMW M4, Toyota Camry, etc.)
   ✅ 3+ Insurance Policies
   ✅ 3+ Roadside Assistance Services
   ✅ Finance/Loans Data
   ✅ Service Bookings
   ✅ Promotions & Offers

🔧 AFTER EVERY FORK - RUN THIS:

   cat /app/frontend/backend-config.json

   Expected to see:
   {
     "backendUrl": "https://api-bridge-dev.preview.emergentagent.com",
     ...
   }

   If wrong, read: /app/CRITICAL-BACKEND-URL-DO-NOT-LOSE.md

🚨 EMERGENCY: IF DATA IS MISSING

   1. Check: cat /app/frontend/backend-config.json
   2. Fix URL if wrong (see above)
   3. Clear cache: rm -rf /app/frontend/.metro-cache
   4. Restart: sudo supervisorctl restart expo
   5. Hard refresh browser: Ctrl+Shift+R

✅ VERIFIED WORKING: YES (2025-01-XX)
