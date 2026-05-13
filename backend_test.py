#!/usr/bin/env python3
"""
Backend API Testing Script for Knowledge IQ RAG System - LIVE INTEGRATION
Tests all backend endpoints with Appwrite, Pinecone, HuggingFace, Groq integrations
"""

import requests
import json
import sys
import time
import uuid
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://rag-intelligence-1.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class TestContext:
    """Store test context data across tests"""
    def __init__(self):
        self.session_token: Optional[str] = None
        self.session_cookie: Optional[str] = None
        self.user_email: Optional[str] = None
        self.upload_id: Optional[str] = None
        self.document_id: Optional[str] = None
        self.session_id: str = f"test-session-{uuid.uuid4()}"

ctx = TestContext()

def print_test(test_name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
    print(f"{status} - {test_name}")
    if details:
        print(f"    {details}")

def test_health_endpoint():
    """Test 1: GET /api/health returns integration flags and success true"""
    print(f"\n{Colors.BLUE}Test 1: Health Endpoint with Integration Flags{Colors.END}")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        data = response.json()
        
        integrations = data.get("data", {}).get("integrations", {})
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "integrations" in data.get("data", {}) and
            "appwrite" in integrations and
            "pinecone" in integrations and
            "groq" in integrations and
            "huggingFace" in integrations
        )
        
        details = f"Status: {response.status_code}, Integrations: appwrite={integrations.get('appwrite')}, pinecone={integrations.get('pinecone')}, groq={integrations.get('groq')}, huggingFace={integrations.get('huggingFace')}"
        print_test("GET /api/health", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/health", False, f"Exception: {str(e)}")
        return False

def test_register_valid():
    """Test 2: POST /api/auth/register with unique email works and returns user + sessionToken"""
    print(f"\n{Colors.BLUE}Test 2: Register with Valid Unique Email{Colors.END}")
    try:
        # Use timestamp to ensure unique email
        unique_email = f"testuser_{int(time.time())}@knowledgeiq.com"
        payload = {
            "email": unique_email,
            "password": "SecurePass123!",
            "name": "Test User"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "user" in data["data"] and
            "sessionToken" in data["data"] and
            data["data"]["user"]["email"] == unique_email
        )
        
        # Store session token and cookie for subsequent tests
        if passed:
            ctx.session_token = data["data"]["sessionToken"]
            ctx.user_email = unique_email
            # Extract cookie from response headers
            set_cookie = response.headers.get("Set-Cookie", "")
            if "rag_scaffold_session=" in set_cookie:
                ctx.session_cookie = set_cookie.split(";")[0]
        
        details = f"Status: {response.status_code}, Email: {unique_email}, Token: {'Present' if data.get('data', {}).get('sessionToken') else 'Missing'}, Cookie: {'Present' if ctx.session_cookie else 'Missing'}"
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
    """Test 4: POST /api/auth/login with same credentials works"""
    print(f"\n{Colors.BLUE}Test 4: Login with Valid Credentials{Colors.END}")
    try:
        if not ctx.user_email:
            print_test("POST /api/auth/login (valid)", False, "No user email from registration")
            return False
        
        login_payload = {
            "email": ctx.user_email,
            "password": "SecurePass123!"
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "user" in data["data"] and
            "sessionToken" in data["data"] and
            data["data"]["user"]["email"] == ctx.user_email
        )
        
        details = f"Status: {response.status_code}, Email: {ctx.user_email}, Token: {'Present' if data.get('data', {}).get('sessionToken') else 'Missing'}"
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

def test_protected_endpoint_without_auth():
    """Test 6: Verify auth-protected endpoints reject without cookie/token"""
    print(f"\n{Colors.BLUE}Test 6: Protected Endpoint Without Auth{Colors.END}")
    try:
        # Try to access documents without auth
        response = requests.get(f"{BASE_URL}/documents", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 401 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("GET /api/documents (no auth)", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/documents (no auth)", False, f"Exception: {str(e)}")
        return False

def test_protected_endpoint_with_auth():
    """Test 7: Verify auth-protected endpoints succeed with auth cookie"""
    print(f"\n{Colors.BLUE}Test 7: Protected Endpoint With Auth{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("GET /api/documents (with auth)", False, "No session cookie available")
            return False
        
        headers = {"Cookie": ctx.session_cookie}
        response = requests.get(f"{BASE_URL}/documents", headers=headers, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            isinstance(data["data"], list)
        )
        
        details = f"Status: {response.status_code}, Documents count: {len(data.get('data', []))}"
        print_test("GET /api/documents (with auth)", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/documents (with auth)", False, f"Exception: {str(e)}")
        return False

def test_chunked_upload_init():
    """Test 8: POST /api/uploads/init with txt file metadata returns uploadId"""
    print(f"\n{Colors.BLUE}Test 8: Chunked Upload Init{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("POST /api/uploads/init", False, "No session cookie available")
            return False
        
        payload = {
            "fileName": "enterprise_security_policy.txt",
            "mimeType": "text/plain",
            "fileSize": 5000,
            "totalChunks": 2
        }
        headers = {"Cookie": ctx.session_cookie}
        response = requests.post(f"{BASE_URL}/uploads/init", json=payload, headers=headers, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "uploadId" in data["data"]
        )
        
        if passed:
            ctx.upload_id = data["data"]["uploadId"]
        
        details = f"Status: {response.status_code}, UploadId: {data.get('data', {}).get('uploadId', 'N/A')}"
        print_test("POST /api/uploads/init", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/uploads/init", False, f"Exception: {str(e)}")
        return False

def test_chunked_upload_chunk():
    """Test 9: POST /api/uploads/chunk for all chunks succeeds"""
    print(f"\n{Colors.BLUE}Test 9: Chunked Upload Chunk{Colors.END}")
    try:
        if not ctx.session_cookie or not ctx.upload_id:
            print_test("POST /api/uploads/chunk", False, "No session cookie or upload ID available")
            return False
        
        # Sample text content split into 2 chunks
        chunk1_content = "Enterprise Security Policy\n\nSection 1: Access Control\nAll employees must use multi-factor authentication for accessing company systems."
        chunk2_content = "\n\nSection 2: Data Protection\nSensitive data must be encrypted at rest and in transit using AES-256 encryption standards."
        
        chunks = [chunk1_content, chunk2_content]
        headers = {"Cookie": ctx.session_cookie}
        
        all_passed = True
        for idx, chunk_text in enumerate(chunks):
            # Create form data with chunk
            files = {
                'chunk': ('chunk', chunk_text.encode('utf-8'), 'application/octet-stream')
            }
            data = {
                'uploadId': ctx.upload_id,
                'chunkIndex': str(idx)
            }
            
            response = requests.post(f"{BASE_URL}/uploads/chunk", data=data, files=files, headers=headers, timeout=10)
            response_data = response.json()
            
            chunk_passed = (
                response.status_code == 200 and
                response_data.get("success") == True and
                "data" in response_data and
                response_data["data"]["uploadId"] == ctx.upload_id and
                response_data["data"]["chunkIndex"] == idx
            )
            
            if not chunk_passed:
                all_passed = False
                print(f"    Chunk {idx} failed: Status {response.status_code}, Response: {response_data}")
            else:
                print(f"    Chunk {idx} uploaded successfully")
        
        details = f"All {len(chunks)} chunks uploaded successfully" if all_passed else "Some chunks failed"
        print_test("POST /api/uploads/chunk (all chunks)", all_passed, details)
        return all_passed
    except Exception as e:
        print_test("POST /api/uploads/chunk", False, f"Exception: {str(e)}")
        return False

def test_chunked_upload_complete():
    """Test 10: POST /api/uploads/complete succeeds and returns created document object"""
    print(f"\n{Colors.BLUE}Test 10: Chunked Upload Complete{Colors.END}")
    try:
        if not ctx.session_cookie or not ctx.upload_id:
            print_test("POST /api/uploads/complete", False, "No session cookie or upload ID available")
            return False
        
        payload = {
            "uploadId": ctx.upload_id
        }
        headers = {"Cookie": ctx.session_cookie}
        response = requests.post(f"{BASE_URL}/uploads/complete", json=payload, headers=headers, timeout=30)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "id" in data["data"]
        )
        
        if passed:
            ctx.document_id = data["data"]["id"]
        
        details = f"Status: {response.status_code}, Document ID: {data.get('data', {}).get('id', 'N/A')}, Message: {data.get('message', 'N/A')}"
        print_test("POST /api/uploads/complete", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/uploads/complete", False, f"Exception: {str(e)}")
        return False

def test_get_documents_after_upload():
    """Test 11: GET /api/documents returns uploaded document"""
    print(f"\n{Colors.BLUE}Test 11: Get Documents After Upload{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("GET /api/documents (after upload)", False, "No session cookie available")
            return False
        
        headers = {"Cookie": ctx.session_cookie}
        response = requests.get(f"{BASE_URL}/documents", headers=headers, timeout=10)
        data = response.json()
        
        documents = data.get("data", [])
        document_found = any(doc.get("id") == ctx.document_id for doc in documents) if ctx.document_id else False
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            isinstance(documents, list) and
            len(documents) > 0 and
            document_found
        )
        
        details = f"Status: {response.status_code}, Documents count: {len(documents)}, Uploaded document found: {document_found}"
        print_test("GET /api/documents (after upload)", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/documents (after upload)", False, f"Exception: {str(e)}")
        return False

def test_chat_ask_rag():
    """Test 12: POST /api/chat/ask with question + sessionId returns answer, sources, mode"""
    print(f"\n{Colors.BLUE}Test 12: RAG Chat Ask{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("POST /api/chat/ask (RAG)", False, "No session cookie available")
            return False
        
        # Wait a bit for indexing to complete
        print("    Waiting 5 seconds for document indexing...")
        time.sleep(5)
        
        payload = {
            "question": "What are the key security policies mentioned in the document?",
            "sessionId": ctx.session_id
        }
        headers = {"Cookie": ctx.session_cookie}
        response = requests.post(f"{BASE_URL}/chat/ask", json=payload, headers=headers, timeout=30)
        data = response.json()
        
        answer_data = data.get("data", {})
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            "answer" in answer_data
        )
        
        details = f"Status: {response.status_code}, Answer present: {bool(answer_data.get('answer'))}, Sources: {len(answer_data.get('sources', []))}, Mode: {answer_data.get('mode', 'N/A')}"
        print_test("POST /api/chat/ask (RAG)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/chat/ask (RAG)", False, f"Exception: {str(e)}")
        return False

def test_chat_ask_missing_fields():
    """Test 13: POST /api/chat/ask missing required fields returns 400"""
    print(f"\n{Colors.BLUE}Test 13: Chat Ask Missing Fields{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("POST /api/chat/ask (missing fields)", False, "No session cookie available")
            return False
        
        payload = {
            "question": "What is the policy?"
            # Missing sessionId
        }
        headers = {"Cookie": ctx.session_cookie}
        response = requests.post(f"{BASE_URL}/chat/ask", json=payload, headers=headers, timeout=10)
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

def test_chat_history():
    """Test 14: GET /api/chat/history?sessionId=... returns saved messages"""
    print(f"\n{Colors.BLUE}Test 14: Chat History{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("GET /api/chat/history", False, "No session cookie available")
            return False
        
        headers = {"Cookie": ctx.session_cookie}
        response = requests.get(f"{BASE_URL}/chat/history?sessionId={ctx.session_id}", headers=headers, timeout=10)
        data = response.json()
        
        history = data.get("data", [])
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            isinstance(history, list) and
            len(history) > 0
        )
        
        details = f"Status: {response.status_code}, Messages count: {len(history)}"
        print_test("GET /api/chat/history", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/chat/history", False, f"Exception: {str(e)}")
        return False

def test_chat_history_missing_session():
    """Test 15: GET /api/chat/history without sessionId returns 400"""
    print(f"\n{Colors.BLUE}Test 15: Chat History Missing SessionId{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("GET /api/chat/history (missing sessionId)", False, "No session cookie available")
            return False
        
        headers = {"Cookie": ctx.session_cookie}
        response = requests.get(f"{BASE_URL}/chat/history", headers=headers, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("GET /api/chat/history (missing sessionId)", passed, details)
        return passed
    except Exception as e:
        print_test("GET /api/chat/history (missing sessionId)", False, f"Exception: {str(e)}")
        return False

def test_delete_document():
    """Test 16: DELETE /api/documents/{id} returns success and removes doc from list"""
    print(f"\n{Colors.BLUE}Test 16: Delete Document{Colors.END}")
    try:
        if not ctx.session_cookie or not ctx.document_id:
            print_test("DELETE /api/documents/{id}", False, "No session cookie or document ID available")
            return False
        
        headers = {"Cookie": ctx.session_cookie}
        response = requests.delete(f"{BASE_URL}/documents/{ctx.document_id}", headers=headers, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get("success") == True and
            "data" in data and
            data["data"]["id"] == ctx.document_id
        )
        
        # Verify document is removed from list
        if passed:
            list_response = requests.get(f"{BASE_URL}/documents", headers=headers, timeout=10)
            list_data = list_response.json()
            documents = list_data.get("data", [])
            document_still_exists = any(doc.get("id") == ctx.document_id for doc in documents)
            passed = passed and not document_still_exists
        
        details = f"Status: {response.status_code}, Deleted ID: {data.get('data', {}).get('id', 'N/A')}, Removed from list: {not document_still_exists if passed else 'N/A'}"
        print_test("DELETE /api/documents/{id}", passed, details)
        return passed
    except Exception as e:
        print_test("DELETE /api/documents/{id}", False, f"Exception: {str(e)}")
        return False

def test_upload_init_missing_fields():
    """Test 17: POST /api/uploads/init missing required fields returns 400"""
    print(f"\n{Colors.BLUE}Test 17: Upload Init Missing Fields{Colors.END}")
    try:
        if not ctx.session_cookie:
            print_test("POST /api/uploads/init (missing fields)", False, "No session cookie available")
            return False
        
        payload = {
            "fileName": "test.txt"
            # Missing totalChunks and fileSize
        }
        headers = {"Cookie": ctx.session_cookie}
        response = requests.post(f"{BASE_URL}/uploads/init", json=payload, headers=headers, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            data.get("success") == False and
            "error" in data
        )
        
        details = f"Status: {response.status_code}, Error: {data.get('error', 'No error message')}"
        print_test("POST /api/uploads/init (missing fields)", passed, details)
        return passed
    except Exception as e:
        print_test("POST /api/uploads/init (missing fields)", False, f"Exception: {str(e)}")
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*80}{Colors.END}")
    print(f"{Colors.YELLOW}Backend API Testing - Knowledge IQ RAG System (LIVE INTEGRATION){Colors.END}")
    print(f"{Colors.YELLOW}Base URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.YELLOW}Testing: Appwrite + Pinecone + HuggingFace + Groq + Chunked Upload{Colors.END}")
    print(f"{Colors.YELLOW}{'='*80}{Colors.END}")
    
    results = []
    
    # Run all tests in sequence
    results.append(("Health Endpoint", test_health_endpoint()))
    results.append(("Register Valid", test_register_valid()))
    results.append(("Register Missing Fields", test_register_missing_fields()))
    results.append(("Login Valid", test_login_valid()))
    results.append(("Login Missing Fields", test_login_missing_fields()))
    results.append(("Protected Endpoint Without Auth", test_protected_endpoint_without_auth()))
    results.append(("Protected Endpoint With Auth", test_protected_endpoint_with_auth()))
    results.append(("Chunked Upload Init", test_chunked_upload_init()))
    results.append(("Chunked Upload Chunk", test_chunked_upload_chunk()))
    results.append(("Chunked Upload Complete", test_chunked_upload_complete()))
    results.append(("Get Documents After Upload", test_get_documents_after_upload()))
    results.append(("RAG Chat Ask", test_chat_ask_rag()))
    results.append(("Chat Ask Missing Fields", test_chat_ask_missing_fields()))
    results.append(("Chat History", test_chat_history()))
    results.append(("Chat History Missing SessionId", test_chat_history_missing_session()))
    results.append(("Delete Document", test_delete_document()))
    results.append(("Upload Init Missing Fields", test_upload_init_missing_fields()))
    
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
        print(f"{Colors.GREEN}All tests passed! Live integration backend is working correctly.{Colors.END}\n")
        return 0
    else:
        print(f"{Colors.RED}Some tests failed! See details above.{Colors.END}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
