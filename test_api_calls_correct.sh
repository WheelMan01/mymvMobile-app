#!/bin/bash

# First login to get the token
echo "=== Testing PIN Login with correct credentials ==="
LOGIN_RESPONSE=$(curl -s -X POST "https://photo-showroom.preview.emergentagent.com/api/auth/pin-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "anthony@wheelsfinance.com.au", "pin": "1234"}')

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
INSURANCE_RESPONSE=$(curl -s -X GET "https://photo-showroom.preview.emergentagent.com/api/insurance-policies" \
  -H "Authorization: Bearer $TOKEN")
echo "$INSURANCE_RESPONSE" | jq '.'
INSURANCE_COUNT=$(echo "$INSURANCE_RESPONSE" | jq '.data.policies | length')
echo "✅ Insurance policies count: $INSURANCE_COUNT"

echo ""
echo "=== Testing Roadside Assistance Endpoint ==="
ROADSIDE_RESPONSE=$(curl -s -X GET "https://photo-showroom.preview.emergentagent.com/api/roadside-assistance" \
  -H "Authorization: Bearer $TOKEN")
echo "$ROADSIDE_RESPONSE" | jq '.'
ROADSIDE_COUNT=$(echo "$ROADSIDE_RESPONSE" | jq '.data.assistance | length')
echo "✅ Roadside assistance count: $ROADSIDE_COUNT"

echo ""
echo "=== Testing Finance Products Endpoint ==="
FINANCE_RESPONSE=$(curl -s -X GET "https://photo-showroom.preview.emergentagent.com/api/finance-products" \
  -H "Authorization: Bearer $TOKEN")
echo "$FINANCE_RESPONSE" | jq '.'
FINANCE_COUNT=$(echo "$FINANCE_RESPONSE" | jq '.data.products | length')
echo "✅ Finance products count: $FINANCE_COUNT"

echo ""
echo "=== Testing Service Bookings Endpoint ==="
BOOKINGS_RESPONSE=$(curl -s -X GET "https://photo-showroom.preview.emergentagent.com/api/service-bookings" \
  -H "Authorization: Bearer $TOKEN")
echo "$BOOKINGS_RESPONSE" | jq '.'
BOOKINGS_COUNT=$(echo "$BOOKINGS_RESPONSE" | jq '.data.bookings | length')
echo "✅ Service bookings count: $BOOKINGS_COUNT"

echo ""
echo "=== Summary ==="
echo "Insurance policies: $INSURANCE_COUNT"
echo "Roadside assistance: $ROADSIDE_COUNT"
echo "Finance products: $FINANCE_COUNT"
echo "Service bookings: $BOOKINGS_COUNT"
