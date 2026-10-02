"""
Quick test script for FastAPI backend endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoints():
    print("=" * 60)
    print("Testing Windows Security Auditor FastAPI Backend")
    print("=" * 60)

    # Test 1: Health check
    print("\n[1] Testing health check endpoint (GET /)...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✓ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"✗ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 2: Get rules
    print("\n[2] Testing rules endpoint (GET /api/rules)...")
    try:
        response = requests.get(f"{BASE_URL}/api/rules")
        if response.status_code == 200:
            rules = response.json()
            print(f"✓ Retrieved {len(rules)} security rules")
            print(f"   First rule: {rules[0]['rule_id']} - {rules[0]['description'][:50]}...")
        else:
            print(f"✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 3: Run demo audit
    print("\n[3] Testing audit endpoint (GET /api/audit?demo=true)...")
    try:
        response = requests.get(f"{BASE_URL}/api/audit", params={"demo": True})
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Audit completed successfully")
            print(f"   Scan ID: {result['scan_id']}")
            print(f"   Host: {result['hostname']}")
            print(f"   Mode: {result['mode']}")
            print(f"   Risk-Weighted Score: {result['scores']['weighted_score']}%")
            print(f"   Results: {result['scores']['passed']} passed, {result['scores']['failed']} failed")
        else:
            print(f"✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 4: Get scan history
    print("\n[4] Testing history endpoint (GET /api/history)...")
    try:
        response = requests.get(f"{BASE_URL}/api/history", params={"limit": 5})
        if response.status_code == 200:
            history = response.json()
            print(f"✓ Retrieved {len(history)} historical scans")
            if history:
                latest = history[0]
                print(f"   Latest: {latest['scan_id']} - {latest['weighted_score']}% ({latest['mode']} mode)")
        else:
            print(f"✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    # Test 5: Get specific scan results
    print("\n[5] Testing results endpoint (GET /api/results/{scan_id})...")
    try:
        # Get the latest scan_id first
        history_response = requests.get(f"{BASE_URL}/api/history", params={"limit": 1})
        if history_response.status_code == 200:
            history = history_response.json()
            if history:
                scan_id = history[0]['scan_id']
                response = requests.get(f"{BASE_URL}/api/results/{scan_id}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"✓ Retrieved scan {scan_id}")
                    print(f"   Total rules checked: {len(result['results'])}")
                else:
                    print(f"✗ Failed: {response.status_code}")
            else:
                print("✗ No scans in history yet")
        else:
            print(f"✗ Failed to get history: {history_response.status_code}")
    except Exception as e:
        print(f"✗ Error: {e}")

    print("\n" + "=" * 60)
    print("Testing complete! FastAPI backend is ready.")
    print("=" * 60)

if __name__ == "__main__":
    print("\nMake sure the FastAPI server is running on http://localhost:8000")
    print("Start it with: python backend/main.py\n")
    input("Press Enter when the server is ready...")
    test_endpoints()
