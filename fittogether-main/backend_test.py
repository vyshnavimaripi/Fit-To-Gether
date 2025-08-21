#!/usr/bin/env python3
"""
FitTogether Backend API Test Suite
Tests all endpoints and business logic for the Community Fitness Challenge Platform
"""

import requests
import sys
import json
from datetime import datetime
import time

class FitTogetherAPITester:
    def __init__(self, base_url="https://fit-together-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.challenge_id = None
        
        # Test data
        self.test_user = {
            "email": f"test_user_{int(time.time())}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "age_group": "adults",
            "fitness_level": "intermediate"
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details and success:
            print(f"   Details: {details}")

    def make_request(self, method, endpoint, data=None, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_health_check(self):
        """Test health check endpoint"""
        response = self.make_request('GET', 'api/health', auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            success = 'status' in data and data['status'] == 'healthy'
            self.log_test("Health Check", success, f"Status: {data.get('status', 'unknown')}")
            return success
        else:
            self.log_test("Health Check", False, f"Status code: {response.status_code if response else 'No response'}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        response = self.make_request('POST', 'api/auth/register', self.test_user, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user_id' in data:
                self.token = data['access_token']
                self.user_id = data['user_id']
                self.log_test("User Registration", True, f"User ID: {self.user_id}")
                return True
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("User Registration", False, error_msg)
        return False

    def test_user_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        response = self.make_request('POST', 'api/auth/login', login_data, auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                # Update token for subsequent tests
                self.token = data['access_token']
                self.log_test("User Login", True, "Token received")
                return True
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("User Login", False, error_msg)
        return False

    def test_get_user_info(self):
        """Test get current user info"""
        response = self.make_request('GET', 'api/auth/me')
        
        if response and response.status_code == 200:
            data = response.json()
            expected_fields = ['user_id', 'email', 'full_name', 'age_group', 'fitness_level']
            success = all(field in data for field in expected_fields)
            self.log_test("Get User Info", success, f"Email: {data.get('email', 'N/A')}")
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Get User Info", False, error_msg)
        return False

    def test_create_challenge(self):
        """Test challenge creation"""
        challenge_data = {
            "name": "Test Walking Challenge",
            "description": "A test challenge for walking 10,000 steps daily",
            "goal_type": "steps",
            "target_value": 70000,  # 10k steps for 7 days
            "duration_days": 7,
            "age_groups": ["adults", "youth"],
            "difficulty_level": "medium"
        }
        
        response = self.make_request('POST', 'api/challenges', challenge_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'challenge_id' in data:
                self.challenge_id = data['challenge_id']
                self.log_test("Create Challenge", True, f"Challenge ID: {self.challenge_id}")
                return True
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Create Challenge", False, error_msg)
        return False

    def test_get_challenges(self):
        """Test getting challenges with filtering"""
        # Test without filters
        response = self.make_request('GET', 'api/challenges', auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list)
            self.log_test("Get All Challenges", success, f"Found {len(data)} challenges")
            
            # Test with age group filter
            response_filtered = self.make_request('GET', 'api/challenges?age_group=adults', auth_required=False)
            if response_filtered and response_filtered.status_code == 200:
                filtered_data = response_filtered.json()
                self.log_test("Get Challenges (Age Filter)", True, f"Found {len(filtered_data)} adult challenges")
                return True
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Get Challenges", False, error_msg)
        return False

    def test_join_challenge(self):
        """Test joining a challenge"""
        if not self.challenge_id:
            self.log_test("Join Challenge", False, "No challenge ID available")
            return False
        
        response = self.make_request('POST', f'api/challenges/{self.challenge_id}/join')
        
        if response and response.status_code == 200:
            data = response.json()
            success = 'message' in data and 'challenge_id' in data
            self.log_test("Join Challenge", success, data.get('message', ''))
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Join Challenge", False, error_msg)
        return False

    def test_log_progress(self):
        """Test logging progress"""
        if not self.challenge_id:
            self.log_test("Log Progress", False, "No challenge ID available")
            return False
        
        progress_data = {
            "challenge_id": self.challenge_id,
            "value": 8500.0,  # 8500 steps
            "notes": "Great morning walk!"
        }
        
        response = self.make_request('POST', 'api/progress', progress_data)
        
        if response and response.status_code == 200:
            data = response.json()
            expected_fields = ['progress_id', 'user_id', 'challenge_id', 'value', 'completion_percentage']
            success = all(field in data for field in expected_fields)
            completion = data.get('completion_percentage', 0)
            self.log_test("Log Progress", success, f"Completion: {completion:.1f}%")
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Log Progress", False, error_msg)
        return False

    def test_get_user_progress(self):
        """Test getting user progress for a challenge"""
        if not self.challenge_id:
            self.log_test("Get User Progress", False, "No challenge ID available")
            return False
        
        response = self.make_request('GET', f'api/progress/{self.challenge_id}')
        
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list)
            self.log_test("Get User Progress", success, f"Found {len(data)} progress entries")
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Get User Progress", False, error_msg)
        return False

    def test_get_leaderboard(self):
        """Test getting leaderboard"""
        if not self.challenge_id:
            self.log_test("Get Leaderboard", False, "No challenge ID available")
            return False
        
        response = self.make_request('GET', f'api/leaderboard/{self.challenge_id}', auth_required=False)
        
        if response and response.status_code == 200:
            data = response.json()
            success = 'leaderboard' in data and 'challenge_id' in data
            leaderboard_count = len(data.get('leaderboard', []))
            self.log_test("Get Leaderboard", success, f"Found {leaderboard_count} entries")
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Get Leaderboard", False, error_msg)
        return False

    def test_health_warnings(self):
        """Test health warnings system (unique feature)"""
        response = self.make_request('POST', 'api/warnings/check')
        
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list)
            warnings_count = len(data)
            self.log_test("Health Warnings Check", success, f"Found {warnings_count} warnings")
            
            # Test warning structure if any warnings exist
            if warnings_count > 0:
                warning = data[0]
                expected_fields = ['warning_id', 'user_id', 'challenge_id', 'warning_type', 'message', 'severity', 'age_specific_risks']
                warning_structure_valid = all(field in warning for field in expected_fields)
                self.log_test("Health Warning Structure", warning_structure_valid, f"Severity: {warning.get('severity', 'N/A')}")
            
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Health Warnings Check", False, error_msg)
        return False

    def test_get_my_challenges(self):
        """Test getting user's joined challenges"""
        response = self.make_request('GET', 'api/challenges/my')
        
        if response and response.status_code == 200:
            data = response.json()
            success = isinstance(data, list)
            self.log_test("Get My Challenges", success, f"Found {len(data)} joined challenges")
            return success
        
        error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
        self.log_test("Get My Challenges", False, error_msg)
        return False

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting FitTogether Backend API Test Suite")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ User registration failed - stopping tests")
            return False
        
        if not self.test_user_login():
            print("❌ User login failed - stopping tests")
            return False
        
        if not self.test_get_user_info():
            print("❌ Get user info failed - stopping tests")
            return False
        
        # Challenge management
        if not self.test_create_challenge():
            print("❌ Challenge creation failed - stopping tests")
            return False
        
        self.test_get_challenges()
        
        if not self.test_join_challenge():
            print("❌ Join challenge failed - stopping tests")
            return False
        
        # Progress tracking
        self.test_log_progress()
        self.test_get_user_progress()
        self.test_get_leaderboard()
        self.test_get_my_challenges()
        
        # Unique feature - Health warnings
        self.test_health_warnings()
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend is working correctly.")
            return True
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"⚠️  {failed_tests} test(s) failed. Check the details above.")
            return False

def main():
    """Main test execution"""
    tester = FitTogetherAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())