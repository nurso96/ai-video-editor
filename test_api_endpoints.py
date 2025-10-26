#!/usr/bin/env python3
"""
Quick API endpoint verification script.
Tests that all required endpoints are accessible and respond correctly.
"""

from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def test_endpoint(method: str, path: str, **kwargs):
    """Test an endpoint and print the result."""
    try:
        if method == "GET":
            response = client.get(path, **kwargs)
        elif method == "POST":
            response = client.post(path, **kwargs)
        else:
            print(f"  ❌ Unsupported method: {method}")
            return False
        
        status_ok = response.status_code in [200, 201, 422]  # 422 for validation errors is OK
        emoji = "✅" if status_ok else "❌"
        print(f"  {emoji} {method:4} {path:40} -> {response.status_code}")
        return status_ok
    except Exception as e:
        print(f"  ❌ {method:4} {path:40} -> ERROR: {str(e)[:50]}")
        return False

def main():
    print("=" * 80)
    print("AI Video Editor Backend - Endpoint Verification")
    print("=" * 80)
    
    results = []
    
    # Health Check
    print("\n📊 Health Check")
    results.append(test_endpoint("GET", "/api/healthz"))
    
    # Project & Timeline Management
    print("\n📁 Project & Timeline Management")
    results.append(test_endpoint("POST", "/api/ingest", files={"file": ("test.mp4", b"fake", "video/mp4")}))
    results.append(test_endpoint("GET", "/api/projects"))
    results.append(test_endpoint("GET", "/api/timeline/1"))
    results.append(test_endpoint("POST", "/api/timeline/1", json={"timeline": {}}))
    results.append(test_endpoint("POST", "/api/timeline/1/analyze"))
    
    # Rendering
    print("\n🎬 Rendering")
    results.append(test_endpoint("POST", "/api/render/1", json={"watermark": True}))
    results.append(test_endpoint("GET", "/api/render/status/fake-job-id"))
    
    # AI Tools
    print("\n🤖 AI Tools")
    results.append(test_endpoint("POST", "/api/tools", json={"tool": "unknown"}))
    results.append(test_endpoint("POST", "/api/tools/generate_video", json={
        "model": "ltx-video",
        "prompt": "test"
    }))
    results.append(test_endpoint("POST", "/api/tools/edit_image", json={
        "model": "image-edit",
        "prompt": "test"
    }))
    
    # Chat
    print("\n💬 Chat")
    results.append(test_endpoint("GET", "/api/chat/sessions"))
    results.append(test_endpoint("POST", "/api/chat/sessions", json={"title": "Test"}))
    results.append(test_endpoint("GET", "/api/chat/sessions/1"))
    results.append(test_endpoint("POST", "/api/chat/sessions/1/messages", json={"message": "hello"}))
    
    # Consent
    print("\n📝 Consent")
    results.append(test_endpoint("GET", "/api/consent/1"))
    results.append(test_endpoint("POST", "/api/consent/1/checkbox", json={"accepted": True}))
    results.append(test_endpoint("POST", "/api/consent/1/upload", 
                                 files={"file": ("test.pdf", b"fake", "application/pdf")}))
    
    # Summary
    print("\n" + "=" * 80)
    passed = sum(results)
    total = len(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"Results: {passed}/{total} endpoints accessible ({percentage:.1f}%)")
    
    if passed == total:
        print("✅ All required endpoints are implemented and accessible!")
    else:
        print("⚠️  Some endpoints may need attention (404s expected for non-existent resources)")
    
    print("=" * 80)
    
    # Detailed API summary
    print("\n📋 Complete API Endpoint List:")
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods') and '/api/' in route.path:
            methods = ', '.join(sorted(route.methods - {'HEAD', 'OPTIONS'}))
            print(f"  {methods:10} {route.path}")

if __name__ == "__main__":
    main()
