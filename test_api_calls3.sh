#!/bin/bash

# First login to get the token
echo "=== Testing PIN Login at /api/auth/pin-login ==="
LOGIN_RESPONSE=$(curl -s -X POST "https://mobile-backend-sync-1.preview.emergentagent.com/api/auth/pin-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser2@example.com", "pin": "1234"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo ""
echo "Token: $TOKEN"

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo ""
echo "✅ Login successful! Testing other endpoints..."

echo ""
echo "=== Testing Insurance Policies Endpoint ==="
INSURANCE_RESPONSE=$(curl -s -X GET "https://mobile-backend-sync-1.preview.emergentagent.com/api/insurance-policies" \
  -H "Authorization: Bearer $TOKEN")
echo "$INSURANCE_RESPONSE" | jq '.'
echo "Insurance policies count: $(echo "$INSURANCE_RESPONSE" | jq '.data.policies | length')"

echo ""
echo "=== Testing Roadside Assistance Endpoint ==="
ROADSIDE_RESPONSE=$(curl -s -X GET "https://mobile-backend-sync-1.preview.emergentagent.com/api/roadside-assistance" \
  -H "Authorization: Bearer $TOKEN")
echo "$ROADSIDE_RESPONSE" | jq '.'
echo "Roadside assistance count: $(echo "$ROADSIDE_RESPONSE" | jq '.data.assistance | length')"

echo ""
echo "=== Testing Finance Products Endpoint ==="
FINANCE_RESPONSE=$(curl -s -X GET "https://mobile-backend-sync-1.preview.emergentagent.com/api/finance-products" \
  -H "Authorization: Bearer $TOKEN")
echo "$FINANCE_RESPONSE" | jq '.'
echo "Finance products count: $(echo "$FINANCE_RESPONSE" | jq '.data.products | length')"

echo ""
echo "=== Testing Service Bookings Endpoint ==="
BOOKINGS_RESPONSE=$(curl -s -X GET "https://mobile-backend-sync-1.preview.emergentagent.com/api/service-bookings" \
  -H "Authorization: Bearer $TOKEN")
echo "$BOOKINGS_RESPONSE" | jq '.'
echo "Service bookings count: $(echo "$BOOKINGS_RESPONSE" | jq '.data.bookings | length')"
