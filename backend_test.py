#!/usr/bin/env python3
"""
Backend API Testing Script for Knowledge IQ RAG System
Tests all backend endpoints according to test_result.md protocol
"""

import requests
import json
import sys
from typing import Dict, Any

# Base URL from environment
BASE_URL = "https://rag-intelligence-1.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(test_name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")

def test_health_endpoint():
    """Test 1: GET /api/health returns success true and integration readiness payload"""
    print(f"\n{Colors.BLUE}Test 1: Health Endpoint{Colors.END}")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "integrations" in data["data"] and
            "service" in data["data"]
        )
        
        details = f"Status: {response.status_code}, Response: {json.dumps(data, indent=2)}"
        print_test("GET /api/health", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/health", False, f"Exception: {str(e)}")
        return False

def test_register_valid():
    """Test 2: POST /api/auth/register with valid payload creates user + sessionToken"""
    print(f"\n{Colors.BLUE}Test 2: Register with Valid Payload{Colors.END}")
    try:
        payload = {
            "email": "alice.johnson@knowledgeiq.com",
            "password": "SecurePass123!",
            "name": "Alice Johnson"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "user" in data["data"] and
            "sessionToken" in data["data"] and
            data["data"]["user"]["email"] == payload["email"]
        )
        
        details = f"Status: {response.status_code}, User: {data.get('data', {}).get('user', {}).get('email')}, Token: {'Present' if data.get('data', {}).get('sessionToken') else 'Missing'}"
        print_test("POST /api/auth/register (valid)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/auth/register (valid)", False, f"Exception: {str(e)}")
        return False

def test_register_missing_fields():
    """Test 3: POST /api/auth/register with missing fields returns 400"""
    print(f"\n{Colors.BLUE}Test 3: Register with Missing Fields{Colors.END}")
    try:
        payload = {
            "email": "incomplete@test.com"
            # Missing password and name
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("POST /api/auth/register (missing fields)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/auth/register (missing fields)", False, f"Exception: {str(e)}")
        return False

def test_login_valid():
    """Test 4: POST /api/auth/login with valid payload returns user + sessionToken"""
    print(f"\n{Colors.BLUE}Test 4: Login with Valid Payload{Colors.END}")
    try:
        # First register a user
        register_payload = {
            "email": "bob.smith@knowledgeiq.com",
            "password": "BobSecure456!",
            "name": "Bob Smith"
        }
        requests.post(f"{BASE_URL}/auth/register", json=register_payload, timeout=10)
        
        # Now login
        login_payload = {
            "email": "bob.smith@knowledgeiq.com",
            "password": "BobSecure456!"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "user" in data["data"] and
            "sessionToken" in data["data"] and
            data["data"]["user"]["email"] == login_payload["email"]
        )
        
        details = f"Status: {response.status_code}, User: {data.get('data', {}).get('user', {}).get('email')}, Token: {'Present' if data.get('data', {}).get('sessionToken') else 'Missing'}"
        print_test("POST /api/auth/login (valid)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/auth/login (valid)", False, f"Exception: {str(e)}")
        return False

def test_login_missing_fields():
    """Test 5: POST /api/auth/login missing fields returns 400"""
    print(f"\n{Colors.BLUE}Test 5: Login with Missing Fields{Colors.END}")
    try:
        payload = {
            "email": "test@test.com"
            # Missing password
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("POST /api/auth/login (missing fields)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/auth/login (missing fields)", False, f"Exception: {str(e)}")
        return False

def test_get_documents():
    """Test 6: GET /api/documents returns array"""
    print(f"\n{Colors.BLUE}Test 6: Get Documents{Colors.END}")
    try:
        response = requests.get(f"{BASE_URL}/documents", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            isinstance(data["data"], list)
        )
        
        details = f"Status: {response.status_code}, Documents count: {len(data.get('data', []))}"
        print_test("GET /api/documents", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/documents", False, f"Exception: {str(e)}")
        return False

def test_create_document_valid():
    """Test 7: POST /api/documents valid metadata creates document"""
    print(f"\n{Colors.BLUE}Test 7: Create Document with Valid Metadata{Colors.END}")
    try:
        payload = {
            "name": "Q4 Financial Report.pdf",
            "type": "application/pdf",
            "size": 1500000,
            "uploadedBy": "carol.white@knowledgeiq.com"
        }
        response = requests.post(f"{BASE_URL}/documents", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "id" in data["data"] and
            data["data"]["name"] == payload["name"]
        )
        
        details = f"Status: {response.status_code}, Document ID: {data.get('data', {}).get('id', 'N/A')}, Name: {data.get('data', {}).get('name', 'N/A')}"
        print_test("POST /api/documents (valid)", passed, details)
        
        # Store document ID for deletion test
        if passed and "data" in data and "id" in data["data"]:
            return passed, data["data"]["id"]
        return passed, None
    except Exception as e:
        print_test("POST /api/documents (valid)", False, f"Exception: {str(e)}")
        return False, None

def test_create_document_missing_fields():
    """Test 8: POST /api/documents missing required fields returns 400"""
    print(f"\n{Colors.BLUE}Test 8: Create Document with Missing Fields{Colors.END}")
    try:
        payload = {
            "name": "Incomplete Document.pdf"
            # Missing type and uploadedBy
        }
        response = requests.post(f"{BASE_URL}/documents", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("POST /api/documents (missing fields)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/documents (missing fields)", False, f"Exception: {str(e)}")
        return False

def test_delete_document(document_id: str):
    """Test 9: DELETE /api/documents/{id} removes document"""
    print(f"\n{Colors.BLUE}Test 9: Delete Document{Colors.END}")
    try:
        response = requests.delete(f"{BASE_URL}/documents/{document_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            data["data"]["id"] == document_id
        )
        
        details = f"Status: {response.status_code}, Deleted ID: {data.get('data', {}).get('id', 'N/A')}"
        print_test("DELETE /api/documents/{id}", passed, details)
        return passed
    except Exception as e:
        print_test("DELETE /api/documents/{id}", False, f"Exception: {str(e)}")
        return False

def test_delete_unknown_document():
    """Test 10: DELETE unknown id returns 404"""
    print(f"\n{Colors.BLUE}Test 10: Delete Unknown Document{Colors.END}")
    try:
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.delete(f"{BASE_URL}/documents/{fake_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 404 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("DELETE /api/documents/{unknown_id}", passed, details)
        return passed
    except Exception as e:
        print_test("DELETE /api/documents/{unknown_id}", False, f"Exception: {str(e)}")
        return False

def test_chat_ask_valid():
    """Test 11: POST /api/chat/ask valid payload returns scaffold answer"""
    print(f"\n{Colors.BLUE}Test 11: Chat Ask with Valid Payload{Colors.END}")
    try:
        payload = {
            "question": "What are the key security policies in our enterprise documentation?",
            "sessionId": "test-session-12345"
        }
        response = requests.post(f"{BASE_URL}/chat/ask", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data
        )
        
        details = f"Status: {response.status_code}, Answer present: {bool(data.get('data'))}"
        print_test("POST /api/chat/ask (valid)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/chat/ask (valid)", False, f"Exception: {str(e)}")
        return False

def test_chat_ask_missing_fields():
    """Test 12: POST /api/chat/ask missing fields returns 400"""
    print(f"\n{Colors.BLUE}Test 12: Chat Ask with Missing Fields{Colors.END}")
    try:
        payload = {
            "question": "What is the policy?"
            # Missing sessionId
        }
        response = requests.post(f"{BASE_URL}/chat/ask", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("POST /api/chat/ask (missing fields)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/chat/ask (missing fields)", False, f"Exception: {str(e)}")
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*80}{Colors.END}")
    print(f"{Colors.YELLOW}Backend API Testing - Knowledge IQ RAG System{Colors.END}")
    print(f"{Colors.YELLOW}Base URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.YELLOW}{'='*80}{Colors.END}")
    
    results = []
    
    # Run all tests
    results.append(("Health Endpoint", test_health_endpoint()))
    results.append(("Register Valid", test_register_valid()))
    results.append(("Register Missing Fields", test_register_missing_fields()))
    results.append(("Login Valid", test_login_valid()))
    results.append(("Login Missing Fields", test_login_missing_fields()))
    results.append(("Get Documents", test_get_documents()))
    
    # Create document and get ID for deletion test
    create_result, doc_id = test_create_document_valid()
    results.append(("Create Document Valid", create_result))
    
    results.append(("Create Document Missing Fields", test_create_document_missing_fields()))
    
    # Delete document if we have an ID
    if doc_id:
        results.append(("Delete Document", test_delete_document(doc_id)))
    else:
        print(f"\n{Colors.YELLOW}⚠️  Skipping delete test - no document ID available{Colors.END}")
        results.append(("Delete Document", False))
    
    results.append(("Delete Unknown Document", test_delete_unknown_document()))
    results.append(("Chat Ask Valid", test_chat_ask_valid()))
    results.append(("Chat Ask Missing Fields", test_chat_ask_missing_fields()))
    
    # Summary
    print(f"\n{Colors.YELLOW}{'='*80}{Colors.END}")
    print(f"{Colors.YELLOW}Test Summary{Colors.END}")
    print(f"{Colors.YELLOW}{'='*80}{Colors.END}")
    
    passed_count = sum(1 for _, result in results if result)
    total_count = len(results)
    
    for test_name, result in results:
        status = f"{Colors.GREEN}✅ PASS{Colors.END}" if result else f"{Colors.RED}❌ FAIL{Colors.END}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.YELLOW}Total: {passed_count}/{total_count} tests passed{Colors.END}")
    
    if passed_count == total_count:
        print(f"{Colors.GREEN}All tests passed!{Colors.END}\n")
        return 0
    else:
        print(f"{Colors.RED}Some tests failed!{Colors.END}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
