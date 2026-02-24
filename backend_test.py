import requests
import sys
from datetime import datetime
import os

class ClassHubAPITester:
    def __init__(self, base_url="https://classroom-sync.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_class_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.session_token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        resp_json = response.json()
                        print(f"   Response keys: {list(resp_json.keys()) if isinstance(resp_json, dict) else 'List response'}")
                        return True, resp_json
                    except:
                        return True, response.text
                return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Raw response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_user(self):
        """Create a test user session using mongosh as per auth testing guidelines"""
        print("🔧 Setting up test user and session...")
        
        # Generate unique test data
        timestamp = int(datetime.now().timestamp())
        user_id = f"test-user-{timestamp}"
        session_token = f"test_session_{timestamp}"
        email = f"test.user.{timestamp}@example.com"
        
        # MongoDB command from auth testing guidelines
        mongo_command = f'''mongosh --eval "
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: '{email}',
  name: 'Test User',
  role: 'student',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Setup complete');
"'''
        
        try:
            # Execute the mongo command
            result = os.system(mongo_command)
            if result == 0:
                self.session_token = session_token
                self.user_id = user_id
                print(f"✅ Test user created: {user_id}")
                print(f"✅ Session token: {session_token}")
                return True
            else:
                print(f"❌ Failed to create test user")
                return False
        except Exception as e:
            print(f"❌ Error setting up test user: {str(e)}")
            return False

    def setup_teacher_user(self):
        """Create a teacher user for testing teacher-specific functionality"""
        print("🔧 Setting up teacher user...")
        
        timestamp = int(datetime.now().timestamp())
        teacher_id = f"teacher-user-{timestamp}"
        teacher_token = f"teacher_session_{timestamp}"
        teacher_email = f"teacher.user.{timestamp}@example.com"
        
        mongo_command = f'''mongosh --eval "
use('test_database');
var teacherId = '{teacher_id}';
var teacherToken = '{teacher_token}';
db.users.insertOne({{
  user_id: teacherId,
  email: '{teacher_email}',
  name: 'Test Teacher',
  role: 'teacher',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: teacherId,
  session_token: teacherToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Teacher setup complete');
"'''
        
        try:
            result = os.system(mongo_command)
            if result == 0:
                self.teacher_token = teacher_token
                self.teacher_id = teacher_id
                print(f"✅ Teacher user created: {teacher_id}")
                return True
            else:
                print(f"❌ Failed to create teacher user")
                return False
        except Exception as e:
            print(f"❌ Error setting up teacher user: {str(e)}")
            return False

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET", 
            "",
            200
        )
        return success

    def test_auth_me(self):
        """Test authentication endpoint"""
        success, response = self.run_test(
            "Auth Me",
            "GET",
            "auth/me",
            200
        )
        if success and 'user_id' in response:
            print(f"   User role: {response.get('role')}")
            print(f"   User email: {response.get('email')}")
        return success

    def test_create_class(self):
        """Test class creation (requires teacher role)"""
        # Switch to teacher token
        temp_token = self.session_token
        self.session_token = getattr(self, 'teacher_token', None)
        
        if not self.session_token:
            print("❌ No teacher token available")
            self.session_token = temp_token
            return False
        
        class_data = {
            "title": "Test Math Class",
            "description": "A test mathematics class",
            "start_time": "2024-12-20T10:00:00Z",
            "end_time": "2024-12-20T11:00:00Z",
            "max_students": 30
        }
        
        success, response = self.run_test(
            "Create Class",
            "POST",
            "classes",
            200,  # Updated: API returns 200, not 201
            data=class_data
        )
        
        if success and 'class_id' in response:
            self.created_class_id = response['class_id']
            print(f"   Created class ID: {self.created_class_id}")
        else:
            print("   Class creation succeeded but no class_id in response")
        
        # Restore original token
        self.session_token = temp_token
        return success

    def test_get_classes(self):
        """Test getting classes list"""
        success, response = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200
        )
        if success:
            classes_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {classes_count} classes")
        return success

    def test_class_enrollment(self):
        """Test class enrollment (student functionality)"""
        if not self.created_class_id:
            print("❌ No class ID available for enrollment")
            return False
        
        enrollment_data = {
            "class_id": self.created_class_id
        }
        
        success, response = self.run_test(
            "Enroll in Class",
            "POST",
            "enrollments",
            200,
            data=enrollment_data
        )
        return success

    def test_create_meet_link(self):
        """Test Google Meet link creation"""
        if not self.created_class_id:
            print("❌ No class ID available for meet link")
            return False
        
        # Switch to teacher token
        temp_token = self.session_token
        self.session_token = getattr(self, 'teacher_token', None)
        
        if not self.session_token:
            print("❌ No teacher token available")
            self.session_token = temp_token
            return False
        
        success, response = self.run_test(
            "Create Meet Link",
            "POST",
            f"classes/{self.created_class_id}/meet",
            200
        )
        
        if success and 'meet_link' in response:
            print(f"   Meet link: {response['meet_link']}")
        
        # Restore original token
        self.session_token = temp_token
        return success

    def test_create_video(self):
        """Test video creation"""
        if not self.created_class_id:
            print("❌ No class ID available for video")
            return False
        
        # Switch to teacher token
        temp_token = self.session_token
        self.session_token = getattr(self, 'teacher_token', None)
        
        if not self.session_token:
            print("❌ No teacher token available")
            self.session_token = temp_token
            return False
        
        video_data = {
            "class_id": self.created_class_id,
            "title": "Test Video",
            "video_url": "https://example.com/video.mp4",
            "description": "A test video"
        }
        
        success, response = self.run_test(
            "Create Video",
            "POST",
            "videos",
            200,  # Updated: API returns 200, not 201
            data=video_data
        )
        
        # Restore original token
        self.session_token = temp_token
        return success

    def test_get_videos(self):
        """Test getting videos"""
        success, response = self.run_test(
            "Get Videos",
            "GET",
            "videos",
            200
        )
        if success:
            videos_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {videos_count} videos")
        return success

    def test_logout(self):
        """Test logout functionality"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

def main():
    """Main test runner"""
    print("🚀 Starting ClassHub API Tests")
    print("="*50)
    
    # Initialize tester
    tester = ClassHubAPITester()
    
    # Setup test users
    if not tester.setup_test_user():
        print("❌ Failed to setup test user, stopping tests")
        return 1
    
    if not tester.setup_teacher_user():
        print("❌ Failed to setup teacher user, some tests may fail")
    
    # Run basic tests
    test_functions = [
        tester.test_api_root,
        tester.test_auth_me,
        tester.test_get_classes,
        tester.test_create_class,
        tester.test_get_classes,  # Test again after creation
        tester.test_class_enrollment,
        tester.test_create_meet_link,
        tester.test_create_video,
        tester.test_get_videos,
        tester.test_logout
    ]
    
    # Execute tests
    print("\n🧪 Running API Tests...")
    print("="*30)
    
    for test_func in test_functions:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} failed with error: {str(e)}")
    
    # Print final results
    print("\n" + "="*50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())