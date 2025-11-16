#!/usr/bin/env python3
"""
Backend API Testing for myMV Customer Mobile App
Tests all backend endpoints with realistic data
"""

import requests
import json
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import sys

# Backend URL from frontend environment
BASE_URL = "https://carmgr-2.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        self.vehicle_id = None
        
    def log_result(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_user_registration(self):
        """Test user registration"""
        test_data = {
            "email": "sarah.johnson@example.com",
            "password": "SecurePass123!",
            "full_name": "Sarah Johnson",
            "phone": "+61412345678"
        }
        
        try:
            response = self.make_request("POST", "/auth/register", test_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_result("User Registration", True, f"User registered successfully. Member ID: {data['user']['member_id']}")
                    return True
                else:
                    self.log_result("User Registration", False, "Missing token or user data in response", data)
                    return False
            else:
                error_msg = response.text
                if response.status_code == 400 and "already registered" in error_msg:
                    self.log_result("User Registration", True, "User already exists (expected for repeated tests)")
                    return self.test_user_login()  # Try login instead
                else:
                    self.log_result("User Registration", False, f"Registration failed with status {response.status_code}", error_msg)
                    return False
        except Exception as e:
            self.log_result("User Registration", False, f"Exception during registration: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login with email/password"""
        test_data = {
            "email": "sarah.johnson@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = self.make_request("POST", "/auth/login", test_data)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.auth_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_result("User Login", True, f"Login successful. User ID: {self.user_id}")
                    return True
                else:
                    self.log_result("User Login", False, "Missing token or user data in response", data)
                    return False
            else:
                self.log_result("User Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Exception during login: {str(e)}")
            return False
    
    def test_get_user_profile(self):
        """Test getting current user profile"""
        try:
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_result("Get User Profile", True, f"Profile retrieved for {data['full_name']}")
                    return True
                else:
                    self.log_result("Get User Profile", False, "Invalid profile data structure", data)
                    return False
            else:
                self.log_result("Get User Profile", False, f"Profile retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get User Profile", False, f"Exception during profile retrieval: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        try:
            response = self.make_request("GET", "/dashboard/stats")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["total_vehicles", "active_insurance_policies", "active_finance_products", "active_roadside_memberships"]
                
                if all(field in data for field in expected_fields):
                    self.log_result("Dashboard Stats", True, f"Stats retrieved: {data}")
                    return True
                else:
                    self.log_result("Dashboard Stats", False, "Missing required fields in stats", data)
                    return False
            else:
                self.log_result("Dashboard Stats", False, f"Stats retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Dashboard Stats", False, f"Exception during stats retrieval: {str(e)}")
            return False
    
    def test_create_vehicle(self):
        """Test creating a new vehicle"""
        test_data = {
            "rego": "ABC123",
            "vin": "1HGBH41JXMN109186",
            "make": "Toyota",
            "model": "Camry",
            "year": 2022,
            "body_type": "Sedan",
            "color": "Silver",
            "odometer": 15000,
            "purchase_date": "2022-03-15T00:00:00Z",
            "purchase_price": 35000.00
        }
        
        try:
            response = self.make_request("POST", "/vehicles", test_data)
            
            if response.status_code == 201 or response.status_code == 200:
                data = response.json()
                if "id" in data and "rego" in data:
                    self.vehicle_id = data["id"]
                    self.log_result("Create Vehicle", True, f"Vehicle created successfully. ID: {self.vehicle_id}")
                    return True
                else:
                    self.log_result("Create Vehicle", False, "Invalid vehicle data structure", data)
                    return False
            else:
                self.log_result("Create Vehicle", False, f"Vehicle creation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Create Vehicle", False, f"Exception during vehicle creation: {str(e)}")
            return False
    
    def test_get_vehicles(self):
        """Test getting all user vehicles"""
        try:
            response = self.make_request("GET", "/vehicles")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Vehicles", True, f"Retrieved {len(data)} vehicles")
                    return True
                else:
                    self.log_result("Get Vehicles", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Get Vehicles", False, f"Vehicle retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Vehicles", False, f"Exception during vehicle retrieval: {str(e)}")
            return False
    
    def test_get_vehicle_details(self):
        """Test getting specific vehicle details"""
        if not self.vehicle_id:
            self.log_result("Get Vehicle Details", False, "No vehicle ID available for testing")
            return False
        
        try:
            response = self.make_request("GET", f"/vehicles/{self.vehicle_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "rego" in data:
                    self.log_result("Get Vehicle Details", True, f"Vehicle details retrieved for {data['make']} {data['model']}")
                    return True
                else:
                    self.log_result("Get Vehicle Details", False, "Invalid vehicle details structure", data)
                    return False
            else:
                self.log_result("Get Vehicle Details", False, f"Vehicle details retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Vehicle Details", False, f"Exception during vehicle details retrieval: {str(e)}")
            return False
    
    def test_update_vehicle(self):
        """Test updating vehicle information"""
        if not self.vehicle_id:
            self.log_result("Update Vehicle", False, "No vehicle ID available for testing")
            return False
        
        update_data = {
            "odometer": 16500,
            "color": "Blue"
        }
        
        try:
            response = self.make_request("PUT", f"/vehicles/{self.vehicle_id}", update_data)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data.get("odometer") == 16500:
                    self.log_result("Update Vehicle", True, f"Vehicle updated successfully. New odometer: {data['odometer']}")
                    return True
                else:
                    self.log_result("Update Vehicle", False, "Vehicle update did not reflect changes", data)
                    return False
            else:
                self.log_result("Update Vehicle", False, f"Vehicle update failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Update Vehicle", False, f"Exception during vehicle update: {str(e)}")
            return False
    
    def test_insurance_policies(self):
        """Test insurance policies endpoint"""
        try:
            response = self.make_request("GET", "/insurance-policies")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Insurance Policies", True, f"Retrieved {len(data)} insurance policies")
                    return True
                else:
                    self.log_result("Insurance Policies", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Insurance Policies", False, f"Insurance policies retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Insurance Policies", False, f"Exception during insurance policies retrieval: {str(e)}")
            return False
    
    def test_finance_products(self):
        """Test finance products endpoint"""
        try:
            response = self.make_request("GET", "/finance-products")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Finance Products", True, f"Retrieved {len(data)} finance products")
                    return True
                else:
                    self.log_result("Finance Products", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Finance Products", False, f"Finance products retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Finance Products", False, f"Exception during finance products retrieval: {str(e)}")
            return False
    
    def test_roadside_assistance(self):
        """Test roadside assistance endpoint"""
        try:
            response = self.make_request("GET", "/roadside-assistance")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Roadside Assistance", True, f"Retrieved {len(data)} roadside memberships")
                    return True
                else:
                    self.log_result("Roadside Assistance", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Roadside Assistance", False, f"Roadside assistance retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Roadside Assistance", False, f"Exception during roadside assistance retrieval: {str(e)}")
            return False
    
    def test_dealers(self):
        """Test dealers endpoint"""
        try:
            response = self.make_request("GET", "/dealers")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Dealers", True, f"Retrieved {len(data)} dealers")
                    return True
                else:
                    self.log_result("Dealers", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Dealers", False, f"Dealers retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Dealers", False, f"Exception during dealers retrieval: {str(e)}")
            return False
    
    def test_promotions(self):
        """Test promotions endpoint"""
        try:
            response = self.make_request("GET", "/promotions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Promotions", True, f"Retrieved {len(data)} promotions")
                    return True
                else:
                    self.log_result("Promotions", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Promotions", False, f"Promotions retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Promotions", False, f"Exception during promotions retrieval: {str(e)}")
            return False
    
    def test_service_bookings(self):
        """Test service bookings endpoint"""
        try:
            response = self.make_request("GET", "/service-bookings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Service Bookings", True, f"Retrieved {len(data)} service bookings")
                    return True
                else:
                    self.log_result("Service Bookings", False, "Response is not a list", data)
                    return False
            else:
                self.log_result("Service Bookings", False, f"Service bookings retrieval failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Service Bookings", False, f"Exception during service bookings retrieval: {str(e)}")
            return False
    
    def test_delete_vehicle(self):
        """Test deleting a vehicle"""
        if not self.vehicle_id:
            self.log_result("Delete Vehicle", False, "No vehicle ID available for testing")
            return False
        
        try:
            response = self.make_request("DELETE", f"/vehicles/{self.vehicle_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_result("Delete Vehicle", True, "Vehicle deleted successfully")
                    return True
                else:
                    self.log_result("Delete Vehicle", False, "Unexpected delete response", data)
                    return False
            else:
                self.log_result("Delete Vehicle", False, f"Vehicle deletion failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Delete Vehicle", False, f"Exception during vehicle deletion: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting myMV Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed, trying login...")
            if not self.test_user_login():
                print("❌ Both registration and login failed. Cannot continue.")
                return False
        
        # Test authenticated endpoints
        self.test_get_user_profile()
        self.test_dashboard_stats()
        
        # Vehicle management flow
        self.test_create_vehicle()
        self.test_get_vehicles()
        self.test_get_vehicle_details()
        self.test_update_vehicle()
        
        # Other services (smoke tests)
        self.test_insurance_policies()
        self.test_finance_products()
        self.test_roadside_assistance()
        self.test_dealers()
        self.test_promotions()
        self.test_service_bookings()
        
        # Cleanup
        self.test_delete_vehicle()
        
        # Summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

def main():
    """Main test execution"""
    tester = BackendTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()