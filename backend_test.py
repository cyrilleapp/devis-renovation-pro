#!/usr/bin/env python3
"""
Backend API Tests for Enterprise Profile and Professional PDF Generation
Tests the new endpoints for enterprise management and improved PDF generation.
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url() + "/api"
print(f"🔗 Testing backend at: {BASE_URL}")

# Test credentials
TEST_EMAIL = "testpdf@test.com"
TEST_PASSWORD = "test123"
TEST_NAME = "Test PDF User"

# Global variables for test data
auth_token = None
user_id = None
devis_id = None

def make_request(method, endpoint, data=None, headers=None):
    """Helper function to make HTTP requests"""
    url = f"{BASE_URL}{endpoint}"
    default_headers = {"Content-Type": "application/json"}
    
    if headers:
        default_headers.update(headers)
    
    if auth_token:
        default_headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=default_headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=default_headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=default_headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, json=data, headers=default_headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=default_headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_user_registration():
    """Test 1: Register new user"""
    global auth_token, user_id
    
    print("\n🧪 Test 1: User Registration")
    
    user_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "nom": TEST_NAME
    }
    
    response = make_request("POST", "/auth/register", user_data)
    
    if not response:
        print("❌ Registration request failed")
        return False
    
    if response.status_code == 400:
        # User might already exist, try login instead
        print("ℹ️  User already exists, attempting login...")
        return test_user_login()
    
    if response.status_code != 200:
        print(f"❌ Registration failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    auth_token = data.get("access_token")
    user_id = data.get("user", {}).get("id")
    
    if not auth_token or not user_id:
        print("❌ Registration response missing token or user ID")
        return False
    
    print(f"✅ User registered successfully: {user_id}")
    return True

def test_user_login():
    """Fallback: Login if registration fails"""
    global auth_token, user_id
    
    print("🔑 Attempting login...")
    
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = make_request("POST", "/auth/login", login_data)
    
    if not response or response.status_code != 200:
        print(f"❌ Login failed: {response.status_code if response else 'No response'}")
        return False
    
    data = response.json()
    auth_token = data.get("access_token")
    user_id = data.get("user", {}).get("id")
    
    if not auth_token or not user_id:
        print("❌ Login response missing token or user ID")
        return False
    
    print(f"✅ Login successful: {user_id}")
    return True

def test_get_entreprise_empty():
    """Test 2: Get empty enterprise profile"""
    print("\n🧪 Test 2: Get Empty Enterprise Profile")
    
    response = make_request("GET", "/entreprise")
    
    if not response or response.status_code != 200:
        print(f"❌ Get entreprise failed: {response.status_code if response else 'No response'}")
        return False
    
    data = response.json()
    print(f"✅ Empty enterprise profile retrieved: {json.dumps(data, indent=2)}")
    
    # Verify it's empty/default
    if data.get("nom") == "":
        print("✅ Enterprise profile is correctly empty")
        return True
    else:
        print("ℹ️  Enterprise profile already has data")
        return True

def test_update_entreprise():
    """Test 3: Update enterprise profile with complete data"""
    print("\n🧪 Test 3: Update Enterprise Profile")
    
    entreprise_data = {
        "nom": "Rénovation Pro",
        "adresse": "123 rue du Commerce",
        "code_postal": "75001",
        "ville": "Paris",
        "telephone": "0123456789",
        "email": "contact@renovation-pro.fr",
        "siret": "12345678900012",
        "tva_intracom": "FR12345678901",
        "conditions_paiement": {
            "type": "acomptes",
            "delai_jours": 30,
            "acomptes": [
                {
                    "pourcentage": 30,
                    "delai_jours": 0,
                    "description": "À la commande"
                },
                {
                    "pourcentage": 40,
                    "delai_jours": 15,
                    "description": "À mi-travaux"
                },
                {
                    "pourcentage": 30,
                    "delai_jours": 0,
                    "description": "À la réception"
                }
            ]
        },
        "mentions_legales": "Travaux réalisés selon les règles de l'art.",
        "garantie": "Garantie décennale"
    }
    
    response = make_request("PUT", "/entreprise", entreprise_data)
    
    if not response or response.status_code != 200:
        print(f"❌ Update entreprise failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"Error details: {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Enterprise profile updated successfully")
    
    # Verify key fields
    if (data.get("nom") == "Rénovation Pro" and 
        data.get("siret") == "12345678900012" and
        data.get("conditions_paiement", {}).get("type") == "acomptes"):
        print("✅ Enterprise data correctly saved")
        return True
    else:
        print("❌ Enterprise data not saved correctly")
        print(f"Received: {json.dumps(data, indent=2)}")
        return False

def test_get_entreprise_populated():
    """Test 4: Verify enterprise profile is populated"""
    print("\n🧪 Test 4: Get Populated Enterprise Profile")
    
    response = make_request("GET", "/entreprise")
    
    if not response or response.status_code != 200:
        print(f"❌ Get entreprise failed: {response.status_code if response else 'No response'}")
        return False
    
    data = response.json()
    
    # Verify populated data
    if (data.get("nom") == "Rénovation Pro" and 
        data.get("siret") == "12345678900012" and
        len(data.get("conditions_paiement", {}).get("acomptes", [])) == 3):
        print("✅ Enterprise profile correctly populated with all data")
        print(f"   - Company: {data.get('nom')}")
        print(f"   - SIRET: {data.get('siret')}")
        print(f"   - Payment terms: {len(data.get('conditions_paiement', {}).get('acomptes', []))} installments")
        return True
    else:
        print("❌ Enterprise profile not correctly populated")
        print(f"Received: {json.dumps(data, indent=2)}")
        return False

def test_create_devis_new_format():
    """Test 5: Create devis with new ClientInfo format"""
    global devis_id
    
    print("\n🧪 Test 5: Create Devis with New ClientInfo Format")
    
    devis_data = {
        "client": {
            "nom": "Dupont",
            "prenom": "Jean",
            "adresse": "45 avenue des Fleurs",
            "code_postal": "75008",
            "ville": "Paris",
            "telephone": "0612345678",
            "email": "jean.dupont@email.com"
        },
        "tva_taux": 20,
        "validite_jours": 30,
        "notes": "Devis pour rénovation complète",
        "postes": [
            {
                "categorie": "cuisine",
                "reference_id": "test-1",
                "reference_nom": "Cuisine équipée",
                "quantite": 5,
                "unite": "m²",
                "prix_min": 100,
                "prix_max": 200,
                "prix_default": 150
            }
        ]
    }
    
    response = make_request("POST", "/devis", devis_data)
    
    if not response or response.status_code != 200:
        print(f"❌ Create devis failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"Error details: {response.text}")
        return False
    
    data = response.json()
    devis_id = data.get("id")
    
    if not devis_id:
        print("❌ Devis creation response missing ID")
        return False
    
    # Verify new client format
    client = data.get("client", {})
    if (client.get("nom") == "Dupont" and 
        client.get("prenom") == "Jean" and
        client.get("email") == "jean.dupont@email.com"):
        print(f"✅ Devis created with new ClientInfo format: {devis_id}")
        print(f"   - Client: {client.get('prenom')} {client.get('nom')}")
        print(f"   - Total TTC: {data.get('total_ttc')}€")
        return True
    else:
        print("❌ Devis client format incorrect")
        print(f"Client data: {json.dumps(client, indent=2)}")
        return False

def test_get_devis():
    """Test 6: Get devis and verify structure"""
    print("\n🧪 Test 6: Get Devis and Verify Structure")
    
    if not devis_id:
        print("❌ No devis ID available for testing")
        return False
    
    response = make_request("GET", f"/devis/{devis_id}")
    
    if not response or response.status_code != 200:
        print(f"❌ Get devis failed: {response.status_code if response else 'No response'}")
        return False
    
    data = response.json()
    
    # Verify structure
    required_fields = ["id", "numero_devis", "client", "total_ht", "total_ttc", "postes"]
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        print(f"❌ Devis missing required fields: {missing_fields}")
        return False
    
    # Verify client structure
    client = data.get("client", {})
    client_fields = ["nom", "prenom", "adresse", "code_postal", "ville", "telephone", "email"]
    missing_client_fields = [field for field in client_fields if field not in client]
    
    if missing_client_fields:
        print(f"❌ Client missing fields: {missing_client_fields}")
        return False
    
    print(f"✅ Devis structure verified correctly")
    print(f"   - Number: {data.get('numero_devis')}")
    print(f"   - Client: {client.get('prenom')} {client.get('nom')}")
    print(f"   - Postes: {len(data.get('postes', []))}")
    return True

def test_update_devis():
    """Test 7: Update devis using new PUT endpoint"""
    print("\n🧪 Test 7: Update Devis (PUT endpoint)")
    
    if not devis_id:
        print("❌ No devis ID available for testing")
        return False
    
    update_data = {
        "client": {
            "nom": "Martin",
            "prenom": "Sophie",
            "adresse": "67 boulevard Haussmann",
            "code_postal": "75009",
            "ville": "Paris",
            "telephone": "0687654321",
            "email": "sophie.martin@email.com"
        },
        "tva_taux": 10,
        "notes": "Devis modifié - client changé",
        "postes": [
            {
                "categorie": "cuisine",
                "reference_id": "test-2",
                "reference_nom": "Cuisine sur mesure",
                "quantite": 8,
                "unite": "m²",
                "prix_min": 150,
                "prix_max": 300,
                "prix_default": 200
            }
        ]
    }
    
    response = make_request("PUT", f"/devis/{devis_id}", update_data)
    
    if not response or response.status_code != 200:
        print(f"❌ Update devis failed: {response.status_code if response else 'No response'}")
        if response:
            print(f"Error details: {response.text}")
        return False
    
    data = response.json()
    
    # Verify updates
    client = data.get("client", {})
    if (client.get("nom") == "Martin" and 
        client.get("prenom") == "Sophie" and
        data.get("tva_taux") == 10 and
        len(data.get("postes", [])) == 1):
        
        # Verify totals were recalculated
        expected_ht = 8 * 200  # 8 m² * 200€
        actual_ht = data.get("total_ht")
        expected_ttc = expected_ht * 1.10  # 10% TVA
        actual_ttc = data.get("total_ttc")
        
        print(f"✅ Devis updated successfully")
        print(f"   - New client: {client.get('prenom')} {client.get('nom')}")
        print(f"   - New TVA: {data.get('tva_taux')}%")
        print(f"   - Recalculated HT: {actual_ht}€ (expected: {expected_ht}€)")
        print(f"   - Recalculated TTC: {actual_ttc}€ (expected: {expected_ttc}€)")
        
        if abs(actual_ht - expected_ht) < 0.01 and abs(actual_ttc - expected_ttc) < 0.01:
            print("✅ Totals correctly recalculated")
            return True
        else:
            print("❌ Totals not correctly recalculated")
            return False
    else:
        print("❌ Devis not updated correctly")
        print(f"Client: {json.dumps(client, indent=2)}")
        return False

def test_generate_pdf():
    """Test 8: Generate professional PDF"""
    print("\n🧪 Test 8: Generate Professional PDF")
    
    if not devis_id:
        print("❌ No devis ID available for testing")
        return False
    
    response = make_request("GET", f"/devis/{devis_id}/pdf")
    
    if not response:
        print("❌ PDF generation request failed")
        return False
    
    if response.status_code != 200:
        print(f"❌ PDF generation failed: {response.status_code}")
        if response.text:
            print(f"Error details: {response.text}")
        return False
    
    # Check if response is PDF
    content_type = response.headers.get('content-type', '')
    if 'application/pdf' not in content_type:
        print(f"❌ Response is not PDF: {content_type}")
        return False
    
    pdf_size = len(response.content)
    if pdf_size < 1000:  # PDF should be at least 1KB
        print(f"❌ PDF too small: {pdf_size} bytes")
        return False
    
    print(f"✅ PDF generated successfully")
    print(f"   - Size: {pdf_size} bytes")
    print(f"   - Content-Type: {content_type}")
    
    # Save PDF for manual verification if needed
    try:
        with open('/tmp/test_devis.pdf', 'wb') as f:
            f.write(response.content)
        print(f"   - Saved to: /tmp/test_devis.pdf")
    except Exception as e:
        print(f"   - Could not save PDF: {e}")
    
    return True

def run_all_tests():
    """Run all tests in sequence"""
    print("🚀 Starting Backend API Tests for Enterprise Profile and PDF Generation")
    print("=" * 80)
    
    tests = [
        ("User Registration", test_user_registration),
        ("Get Empty Enterprise Profile", test_get_entreprise_empty),
        ("Update Enterprise Profile", test_update_entreprise),
        ("Get Populated Enterprise Profile", test_get_entreprise_populated),
        ("Create Devis with New ClientInfo", test_create_devis_new_format),
        ("Get Devis Structure", test_get_devis),
        ("Update Devis (PUT)", test_update_devis),
        ("Generate Professional PDF", test_generate_pdf)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\n📈 Total: {len(results)} tests")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Success Rate: {(passed/len(results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Enterprise profile and PDF generation are working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the implementation.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)