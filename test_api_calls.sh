#!/bin/bash

# First login to get the token
echo "=== Testing PIN Login ==="
LOGIN_RESPONSE=$(curl -s -X POST "https://vehicle-ocr.preview.emergentagent.com/api/pin-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "testuser2@example.com", "pin": "1234"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo ""
echo "Token: $TOKEN"

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo ""
echo "=== Testing Insurance Policies Endpoint ==="
curl -s -X GET "https://vehicle-ocr.preview.emergentagent.com/api/insurance-policies" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=== Testing Roadside Assistance Endpoint ==="
curl -s -X GET "https://vehicle-ocr.preview.emergentagent.com/api/roadside-assistance" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=== Testing Finance Products Endpoint ==="
curl -s -X GET "https://vehicle-ocr.preview.emergentagent.com/api/finance-products" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=== Testing Service Bookings Endpoint ==="
curl -s -X GET "https://vehicle-ocr.preview.emergentagent.com/api/service-bookings" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
