#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for myMV Customer Mobile App
Testing Settings API Endpoints with Authentication
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL for new forked database (from backend-config.json)
BACKEND_URL = "https://fork-safe-auth.preview.emergentagent.com"

# Test credentials from review request
TEST_EMAIL = "anthony@wheelsfinance.com.au"
TEST_PIN = "1234"

class SettingsAPITester:
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

    def authenticate(self):
        """Authenticate with PIN login"""
        print("🔐 AUTHENTICATING WITH PIN LOGIN...")
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/pin-login",
                json={"email": TEST_EMAIL, "pin": TEST_PIN},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.user_data = data["user"]
                self.log_test("PIN Authentication", True, f"Authenticated as {self.user_data['email']}")
                return True
            else:
                self.log_test("PIN Authentication", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("PIN Authentication", False, f"Exception: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def test_get_current_user(self):
        """Test GET /api/auth/me - Get current user data"""
        print("👤 TESTING GET CURRENT USER...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "email", "full_name", "phone", "member_id", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Get Current User", True, f"Retrieved user data for {data['email']}")
                    return data
                else:
                    self.log_test("Get Current User", False, f"Missing fields: {missing_fields}", data)
                    return None
            else:
                self.log_test("Get Current User", False, f"Status: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Get Current User", False, f"Exception: {str(e)}")
            return None

    def test_update_profile(self):
        """Test PUT /api/user/profile - Update user profile"""
        print("📝 TESTING PROFILE UPDATE...")
        
        # Test 1: Update first_name and last_name
        try:
            update_data = {
                "first_name": "Anthony",
                "last_name": "Smith"
            }
            
            response = requests.put(
                f"{self.base_url}/api/user/profile",
                json=update_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Profile Update - Names", True, "Successfully updated first and last name")
            else:
                self.log_test("Profile Update - Names", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Profile Update - Names", False, f"Exception: {str(e)}")
        
        # Test 2: Update mobile number
        try:
            update_data = {
                "mobile": "+61412345678"
            }
            
            response = requests.put(
                f"{self.base_url}/api/user/profile",
                json=update_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Profile Update - Mobile", True, "Successfully updated mobile number")
            else:
                self.log_test("Profile Update - Mobile", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Profile Update - Mobile", False, f"Exception: {str(e)}")
        
        # Test 3: Try to update with duplicate email (should work as it's likely unique)
        try:
            update_data = {
                "email": "test@unique.com"
            }
            
            response = requests.put(
                f"{self.base_url}/api/user/profile",
                json=update_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Profile Update - Email", True, "Successfully updated email")
                
                # Revert back to original email
                revert_data = {"email": TEST_EMAIL}
                requests.put(f"{self.base_url}/api/user/profile", json=revert_data, headers=self.get_headers(), timeout=30)
            else:
                self.log_test("Profile Update - Email", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Profile Update - Email", False, f"Exception: {str(e)}")
    
    def test_change_password(self):
        """Test POST /api/user/change-password - Change password"""
        print("🔒 TESTING PASSWORD CHANGE...")
        
        # Test 1: Try with incorrect current password
        try:
            password_data = {
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/change-password",
                json=password_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 400:
                self.log_test("Password Change - Wrong Current", True, "Correctly rejected wrong current password")
            else:
                self.log_test("Password Change - Wrong Current", False, f"Expected 400, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Password Change - Wrong Current", False, f"Exception: {str(e)}")
        
        # Test 2: Try with short password (should fail validation)
        try:
            password_data = {
                "current_password": "password123",
                "new_password": "123"  # Too short
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/change-password",
                json=password_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code in [400, 422]:
                self.log_test("Password Change - Short Password", True, "Correctly rejected short password")
            else:
                self.log_test("Password Change - Short Password", False, f"Expected 400/422, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Password Change - Short Password", False, f"Exception: {str(e)}")
    
    def test_notification_preferences(self):
        """Test notification preferences endpoints"""
        print("🔔 TESTING NOTIFICATION PREFERENCES...")
        
        # Test 1: Get notification preferences
        try:
            response = requests.get(
                f"{self.base_url}/api/user/notification-preferences",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "preferences" in data:
                    self.log_test("Get Notification Preferences", True, "Successfully retrieved preferences")
                    current_prefs = data["preferences"]
                else:
                    self.log_test("Get Notification Preferences", False, "Missing 'preferences' key", data)
                    current_prefs = {}
            else:
                self.log_test("Get Notification Preferences", False, f"Status: {response.status_code}", response.text)
                current_prefs = {}
                
        except Exception as e:
            self.log_test("Get Notification Preferences", False, f"Exception: {str(e)}")
            current_prefs = {}
        
        # Test 2: Update notification preferences
        try:
            new_prefs = {
                "sms": True,
                "email": False,
                "push": True,
                "alert_reminders": True,
                "service_reminders": False,
                "marketing_emails": True
            }
            
            response = requests.put(
                f"{self.base_url}/api/user/notification-preferences",
                json=new_prefs,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "preferences" in data and data["preferences"] == new_prefs:
                    self.log_test("Update Notification Preferences", True, "Successfully updated preferences")
                else:
                    self.log_test("Update Notification Preferences", False, "Preferences not updated correctly", data)
            else:
                self.log_test("Update Notification Preferences", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Update Notification Preferences", False, f"Exception: {str(e)}")
    
    def test_subscription_management(self):
        """Test subscription upgrade and cancellation"""
        print("💳 TESTING SUBSCRIPTION MANAGEMENT...")
        
        # Test 1: Upgrade to premium monthly
        try:
            upgrade_data = {
                "subscription_tier": "premium_monthly"
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/upgrade-subscription",
                json=upgrade_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "subscription_tier" in data and data["subscription_tier"] == "premium_monthly":
                    self.log_test("Subscription Upgrade - Premium Monthly", True, "Successfully upgraded to premium monthly")
                else:
                    self.log_test("Subscription Upgrade - Premium Monthly", False, "Upgrade response incorrect", data)
            else:
                self.log_test("Subscription Upgrade - Premium Monthly", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Subscription Upgrade - Premium Monthly", False, f"Exception: {str(e)}")
        
        # Test 2: Try invalid subscription tier
        try:
            upgrade_data = {
                "subscription_tier": "invalid_tier"
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/upgrade-subscription",
                json=upgrade_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 400:
                self.log_test("Subscription Upgrade - Invalid Tier", True, "Correctly rejected invalid tier")
            else:
                self.log_test("Subscription Upgrade - Invalid Tier", False, f"Expected 400, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Subscription Upgrade - Invalid Tier", False, f"Exception: {str(e)}")
        
        # Test 3: Upgrade to premium annual
        try:
            upgrade_data = {
                "subscription_tier": "premium_annual"
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/upgrade-subscription",
                json=upgrade_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Subscription Upgrade - Premium Annual", True, "Successfully upgraded to premium annual")
            else:
                self.log_test("Subscription Upgrade - Premium Annual", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Subscription Upgrade - Premium Annual", False, f"Exception: {str(e)}")
        
        # Test 4: Request account cancellation
        try:
            cancellation_data = {
                "reason": "Testing cancellation functionality"
            }
            
            response = requests.post(
                f"{self.base_url}/api/user/request-cancellation",
                json=cancellation_data,
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Account Cancellation Request", True, "Successfully requested account cancellation")
            else:
                self.log_test("Account Cancellation Request", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Account Cancellation Request", False, f"Exception: {str(e)}")
    
    def test_vehicle_transfers(self):
        """Test vehicle transfer endpoints (Premium feature)"""
        print("🚗 TESTING VEHICLE TRANSFERS...")
        
        # Test 1: Lookup member by member number
        try:
            # Use a known member number (the current user's member number)
            current_user = self.test_get_current_user()
            if current_user and "member_id" in current_user:
                member_number = current_user["member_id"]
                
                response = requests.get(
                    f"{self.base_url}/api/users/lookup/{member_number}",
                    headers=self.get_headers(),
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and "member_number" in data["data"]:
                        self.log_test("Member Lookup - Valid", True, f"Successfully found member {member_number}")
                    else:
                        self.log_test("Member Lookup - Valid", False, "Invalid response structure", data)
                else:
                    self.log_test("Member Lookup - Valid", False, f"Status: {response.status_code}", response.text)
            else:
                self.log_test("Member Lookup - Valid", False, "Could not get current user member ID")
                
        except Exception as e:
            self.log_test("Member Lookup - Valid", False, f"Exception: {str(e)}")
        
        # Test 2: Try lookup with invalid member number
        try:
            response = requests.get(
                f"{self.base_url}/api/users/lookup/INVALID-123",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 404:
                self.log_test("Member Lookup - Invalid", True, "Correctly returned 404 for invalid member")
            else:
                self.log_test("Member Lookup - Invalid", False, f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Member Lookup - Invalid", False, f"Exception: {str(e)}")
        
        # Test 3: Get pending transfers
        try:
            response = requests.get(
                f"{self.base_url}/api/transfers/pending",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "transfers" in data["data"]:
                    self.log_test("Get Pending Transfers", True, f"Retrieved {len(data['data']['transfers'])} pending transfers")
                else:
                    self.log_test("Get Pending Transfers", False, "Invalid response structure", data)
            else:
                self.log_test("Get Pending Transfers", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Pending Transfers", False, f"Exception: {str(e)}")
        
        # Test 4: Get quarantined vehicles
        try:
            response = requests.get(
                f"{self.base_url}/api/transfers/quarantined",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "vehicles" in data["data"]:
                    self.log_test("Get Quarantined Vehicles", True, f"Retrieved {len(data['data']['vehicles'])} quarantined vehicles")
                else:
                    self.log_test("Get Quarantined Vehicles", False, "Invalid response structure", data)
            else:
                self.log_test("Get Quarantined Vehicles", False, f"Status: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Get Quarantined Vehicles", False, f"Exception: {str(e)}")
        
        # Test 5: Try to initiate transfer (requires a vehicle and premium subscription)
        # First, let's check if user has vehicles
        try:
            vehicles_response = requests.get(
                f"{self.base_url}/api/vehicles",
                headers=self.get_headers(),
                timeout=30
            )
            
            if vehicles_response.status_code == 200:
                vehicles = vehicles_response.json()
                if vehicles:
                    # Try to initiate transfer with first vehicle
                    vehicle_id = vehicles[0]["id"]
                    transfer_data = {
                        "vehicle_id": vehicle_id,
                        "new_owner_member_number": "MV-1234567",
                        "new_owner_name": "Test Transfer User",
                        "new_owner_mobile": "+61412345678",
                        "new_owner_email": "transfer@test.com"
                    }
                    
                    response = requests.post(
                        f"{self.base_url}/api/transfers/initiate",
                        json=transfer_data,
                        headers=self.get_headers(),
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        self.log_test("Initiate Transfer - With Premium", True, "Successfully initiated transfer")
                    elif response.status_code == 403:
                        self.log_test("Initiate Transfer - Without Premium", True, "Correctly blocked transfer for non-premium user")
                    else:
                        self.log_test("Initiate Transfer", False, f"Status: {response.status_code}", response.text)
                else:
                    self.log_test("Initiate Transfer", False, "No vehicles available for transfer test")
            else:
                self.log_test("Initiate Transfer", False, f"Could not get vehicles: {vehicles_response.status_code}")
                
        except Exception as e:
            self.log_test("Initiate Transfer", False, f"Exception: {str(e)}")

    def run_connectivity_tests(self):
        """Run quick connectivity tests as requested"""
        print("🚀 BACKEND CONNECTIVITY TEST - NEW FORKED DATABASE")
        print("=" * 60)
        print(f"Testing backend: {self.base_url}")
        print(f"Test email: {TEST_EMAIL}")
        print(f"Test PIN: {TEST_PIN}")
        print("=" * 60)
        
        # Step 1: Authentication Test
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            self.print_summary()
            return False
        
        # Step 2: Profile Data Test
        self.test_get_current_user()
        
        # Step 3: Settings Endpoints Test (as requested)
        self.test_notification_preferences()
        self.test_vehicles_endpoint()
        
        # Step 4: Summary
        self.print_summary()
        return True
    
    def test_vehicles_endpoint(self):
        """Test GET /api/vehicles endpoint"""
        print("🚗 TESTING VEHICLES ENDPOINT...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/vehicles",
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                vehicle_count = len(data) if isinstance(data, list) else 0
                self.log_test("Get Vehicles", True, f"Retrieved {vehicle_count} vehicles from database")
                return True
            else:
                self.log_test("Get Vehicles", False, f"Status: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Vehicles", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Settings API tests"""
        print("🚀 STARTING SETTINGS API COMPREHENSIVE TESTING")
        print("=" * 60)
        print(f"Testing backend: {self.base_url}")
        print(f"Test email: {TEST_EMAIL}")
        print(f"Test PIN: {TEST_PIN}")
        print("=" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Step 2: Run all tests
        self.test_get_current_user()
        self.test_update_profile()
        self.test_change_password()
        self.test_notification_preferences()
        self.test_subscription_management()
        self.test_vehicle_transfers()
        
        # Step 3: Summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}")


if __name__ == "__main__":
    tester = SettingsAPITester()
    # Run quick connectivity tests as requested
    success = tester.run_connectivity_tests()
    
    if not success:
        sys.exit(1)