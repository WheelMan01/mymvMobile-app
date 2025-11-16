#!/usr/bin/env python3
"""
Backend API Testing for myMV Customer Mobile App
Testing PIN Login API Integration with Live Backend
"""

import requests
import json
import sys
from datetime import datetime

# Live backend URL from review request
BACKEND_URL = "https://vehicle-ocr.preview.emergentagent.com"

# Test credentials from review request
TEST_EMAIL = "anthony@wheelsfinance.com.au"
TEST_PIN = "1234"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_pin_login_success(self):
        """Test successful PIN login with correct credentials"""
        url = f"{self.base_url}/api/auth/pin-login"
        
        # Test with the NEW format: {email, pin}
        payload = {
            "email": TEST_EMAIL,
            "pin": TEST_PIN
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "PIN Login - Success Case",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                    return False
                
                # Verify user data structure
                user = data.get("user", {})
                user_required_fields = ["id", "email", "full_name", "member_id"]
                missing_user_fields = [field for field in user_required_fields if field not in user]
                
                if missing_user_fields:
                    self.log_test(
                        "PIN Login - Success Case",
                        False,
                        f"Missing user fields: {missing_user_fields}",
                        data
                    )
                    return False
                
                # Store for subsequent tests
                self.access_token = data["access_token"]
                self.user_data = user
                
                self.log_test(
                    "PIN Login - Success Case",
                    True,
                    f"Login successful for {user['email']}, Member ID: {user['member_id']}"
                )
                return True
                
            else:
                self.log_test(
                    "PIN Login - Success Case",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PIN Login - Success Case",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_pin_login_wrong_pin(self):
        """Test PIN login with incorrect PIN"""
        url = f"{self.base_url}/api/auth/pin-login"
        
        payload = {
            "email": TEST_EMAIL,
            "pin": "9999"  # Wrong PIN
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 401:
                self.log_test(
                    "PIN Login - Wrong PIN",
                    True,
                    "Correctly rejected invalid PIN"
                )
                return True
            else:
                self.log_test(
                    "PIN Login - Wrong PIN",
                    False,
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PIN Login - Wrong PIN",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_pin_login_wrong_email(self):
        """Test PIN login with incorrect email"""
        url = f"{self.base_url}/api/auth/pin-login"
        
        payload = {
            "email": "nonexistent@example.com",
            "pin": TEST_PIN
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 401:
                self.log_test(
                    "PIN Login - Wrong Email",
                    True,
                    "Correctly rejected non-existent email"
                )
                return True
            else:
                self.log_test(
                    "PIN Login - Wrong Email",
                    False,
                    f"Expected 401, got {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PIN Login - Wrong Email",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_pin_login_invalid_email_format(self):
        """Test PIN login with invalid email format"""
        url = f"{self.base_url}/api/auth/pin-login"
        
        payload = {
            "email": "invalid-email-format",
            "pin": TEST_PIN
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code in [400, 422]:  # Bad request or validation error
                self.log_test(
                    "PIN Login - Invalid Email Format",
                    True,
                    "Correctly rejected invalid email format"
                )
                return True
            else:
                self.log_test(
                    "PIN Login - Invalid Email Format",
                    False,
                    f"Expected 400/422, got {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PIN Login - Invalid Email Format",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_vehicles_endpoint(self):
        """Test vehicles endpoint with access token"""
        if not self.access_token:
            self.log_test(
                "Vehicles Endpoint",
                False,
                "No access token available - PIN login must succeed first"
            )
            return False
            
        url = f"{self.base_url}/api/vehicles"
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    vehicle_count = len(data)
                    self.log_test(
                        "Vehicles Endpoint",
                        True,
                        f"Successfully retrieved {vehicle_count} vehicles"
                    )
                    
                    # Log vehicle details if any exist
                    if vehicle_count > 0:
                        print(f"   Vehicle details:")
                        for i, vehicle in enumerate(data[:3]):  # Show first 3 vehicles
                            make = vehicle.get('make', 'Unknown')
                            model = vehicle.get('model', 'Unknown')
                            year = vehicle.get('year', 'Unknown')
                            rego = vehicle.get('rego', 'Unknown')
                            print(f"     {i+1}. {year} {make} {model} (Rego: {rego})")
                        if vehicle_count > 3:
                            print(f"     ... and {vehicle_count - 3} more vehicles")
                        print()
                    
                    return True
                else:
                    self.log_test(
                        "Vehicles Endpoint",
                        False,
                        f"Expected array, got: {type(data)}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Vehicles Endpoint",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "Vehicles Endpoint",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def test_old_pin_login_format(self):
        """Test if the old PIN login format still works (should fail)"""
        url = f"{self.base_url}/api/auth/pin-login"
        
        # Test with the OLD format: {member_id, pin}
        payload = {
            "member_id": "MV-7981038",  # From review request
            "pin": TEST_PIN
        }
        
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code in [400, 422]:  # Should fail with validation error
                self.log_test(
                    "PIN Login - Old Format Check",
                    True,
                    "Old format correctly rejected (API updated to new format)"
                )
                return True
            elif response.status_code == 200:
                self.log_test(
                    "PIN Login - Old Format Check",
                    False,
                    "WARNING: Old format still works - API may not be updated",
                    response.json()
                )
                return False
            else:
                self.log_test(
                    "PIN Login - Old Format Check",
                    True,  # Any other error is acceptable
                    f"Old format rejected with status {response.status_code}"
                )
                return True
                
        except requests.exceptions.RequestException as e:
            self.log_test(
                "PIN Login - Old Format Check",
                False,
                f"Request failed: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("BACKEND API TESTING - PIN LOGIN INTEGRATION")
        print("=" * 60)
        print(f"Testing backend: {self.base_url}")
        print(f"Test email: {TEST_EMAIL}")
        print(f"Test PIN: {TEST_PIN}")
        print("=" * 60)
        print()
        
        # Test sequence
        tests = [
            ("PIN Login Success", self.test_pin_login_success),
            ("Vehicles Endpoint", self.test_vehicles_endpoint),
            ("PIN Login Wrong PIN", self.test_pin_login_wrong_pin),
            ("PIN Login Wrong Email", self.test_pin_login_wrong_email),
            ("PIN Login Invalid Email Format", self.test_pin_login_invalid_email_format),
            ("Old Format Check", self.test_old_pin_login_format),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test crashed: {str(e)}")
        
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Passed: {passed}/{total}")
        print(f"Failed: {total - passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("FAILED TESTS:")
            for test in failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
            print()
        
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL TESTS PASSED - Backend integration working correctly!")
        sys.exit(0)
    else:
        print("⚠️  SOME TESTS FAILED - Check details above")
        sys.exit(1)