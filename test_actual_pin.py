#!/usr/bin/env python3
"""
Test PIN login with actual PIN from database
"""

import requests
import json

# Backend URL
BASE_URL = "https://app-bridge-fix.preview.emergentagent.com/api"

def test_actual_pin_login():
    """Test PIN login with actual PIN"""
    print("🔐 Testing PIN Login with Actual PIN")
    print("=" * 50)
    
    # Use the actual PIN we found: 9763 for member MV-9248591
    pin_data = {
        "member_id": "MV-9248591",
        "pin": "9763"
    }
    
    try:
        print("🔑 Testing PIN login with actual PIN...")
        response = requests.post(f"{BASE_URL}/auth/pin-login", json=pin_data, timeout=30)
        
        if response.status_code == 200:
            user_data = response.json()
            print("✅ PIN login successful!")
            print(f"   Logged in as: {user_data['user']['full_name']}")
            print(f"   Email: {user_data['user']['email']}")
            print(f"   Member ID: {user_data['user']['member_id']}")
            print(f"   Token received: {user_data['access_token'][:20]}...")
            return True
        else:
            print(f"❌ PIN login failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during PIN login test: {str(e)}")
        return False

if __name__ == "__main__":
    test_actual_pin_login()