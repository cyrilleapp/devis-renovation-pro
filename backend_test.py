#!/usr/bin/env python3
"""
Test complet de l'API Devis Rénovation
Tests tous les endpoints selon le scénario demandé
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://renoquote-2.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class DevisAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()

    def make_request(self, method: str, endpoint: str, data: Dict = None, use_auth: bool = False) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if use_auth and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request error: {str(e)}", 0

    def test_1_register_user(self):
        """Test 1: Créer un nouvel utilisateur"""
        user_data = {
            "email": "jean.dupont@renovation.fr",
            "password": "MotDePasse123!",
            "nom": "Jean Dupont"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/register", user_data)
        
        if success and status_code == 200:
            if "access_token" in response and "user" in response:
                self.auth_token = response["access_token"]
                self.user_data = response["user"]
                self.log_test("Création utilisateur", True, f"Utilisateur créé: {response['user']['nom']}")
                return True
            else:
                self.log_test("Création utilisateur", False, "Token ou user manquant dans la réponse", response)
                return False
        else:
            self.log_test("Création utilisateur", False, f"Status: {status_code}", response)
            return False

    def test_2_login_user(self):
        """Test 2: Se connecter pour obtenir un token"""
        login_data = {
            "email": "jean.dupont@renovation.fr",
            "password": "MotDePasse123!"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", login_data)
        
        if success and status_code == 200:
            if "access_token" in response:
                self.auth_token = response["access_token"]
                self.log_test("Connexion utilisateur", True, f"Token obtenu pour: {response['user']['nom']}")
                return True
            else:
                self.log_test("Connexion utilisateur", False, "Token manquant dans la réponse", response)
                return False
        else:
            self.log_test("Connexion utilisateur", False, f"Status: {status_code}", response)
            return False

    def test_3_get_current_user(self):
        """Test 3: Obtenir l'utilisateur courant avec token"""
        success, response, status_code = self.make_request("GET", "/auth/me", use_auth=True)
        
        if success and status_code == 200:
            if "id" in response and "email" in response:
                self.log_test("Utilisateur courant", True, f"Utilisateur récupéré: {response['nom']}")
                return True
            else:
                self.log_test("Utilisateur courant", False, "Données utilisateur incomplètes", response)
                return False
        else:
            self.log_test("Utilisateur courant", False, f"Status: {status_code}", response)
            return False

    def test_4_reference_data(self):
        """Test 4: Vérifier que les données de référence sont disponibles"""
        endpoints = [
            ("/references/cuisine/types", "Types de cuisine"),
            ("/references/cuisine/elements", "Éléments de cuisine"),
            ("/references/cuisine/materiaux", "Matériaux de cuisine"),
            ("/references/cloisons", "Types de cloison"),
            ("/references/peintures", "Types de peinture"),
            ("/references/parquets", "Types de parquet"),
            ("/references/extras", "Extras")
        ]
        
        all_success = True
        for endpoint, name in endpoints:
            success, response, status_code = self.make_request("GET", endpoint)
            
            if success and status_code == 200:
                if isinstance(response, list) and len(response) > 0:
                    self.log_test(f"Données référence - {name}", True, f"{len(response)} éléments trouvés")
                else:
                    self.log_test(f"Données référence - {name}", False, "Liste vide ou format incorrect", response)
                    all_success = False
            else:
                self.log_test(f"Données référence - {name}", False, f"Status: {status_code}", response)
                all_success = False
        
        return all_success

    def test_5_create_devis(self):
        """Test 5: Créer un devis complet avec plusieurs postes"""
        # D'abord récupérer quelques références pour créer un devis réaliste
        success, cuisine_types, _ = self.make_request("GET", "/references/cuisine/types")
        success2, cloisons, _ = self.make_request("GET", "/references/cloisons")
        success3, peintures, _ = self.make_request("GET", "/references/peintures")
        success4, parquets, _ = self.make_request("GET", "/references/parquets")
        
        if not all([success, success2, success3, success4]):
            self.log_test("Création devis", False, "Impossible de récupérer les données de référence")
            return False, None
        
        # Créer un devis avec plusieurs postes
        devis_data = {
            "client_nom": "Madame Martin - Rénovation Appartement",
            "tva_taux": 20.0,
            "postes": [
                {
                    "categorie": "cuisine",
                    "reference_id": cuisine_types[0]["id"],
                    "reference_nom": cuisine_types[0]["nom"],
                    "quantite": 1.0,
                    "unite": "€/prestation",
                    "prix_min": cuisine_types[0]["cout_min"],
                    "prix_max": cuisine_types[0]["cout_max"],
                    "prix_default": (cuisine_types[0]["cout_min"] + cuisine_types[0]["cout_max"]) / 2,
                    "prix_ajuste": 8000.0,
                    "options": {
                        "nb_meubles_haut": 6,
                        "nb_meubles_bas": 8,
                        "nb_appareils": 3
                    }
                },
                {
                    "categorie": "cloison",
                    "reference_id": cloisons[0]["id"],
                    "reference_nom": cloisons[0]["nom"],
                    "quantite": 15.5,
                    "unite": cloisons[0]["unite"],
                    "prix_min": cloisons[0]["pose_incluse_min"],
                    "prix_max": cloisons[0]["pose_incluse_max"],
                    "prix_default": (cloisons[0]["pose_incluse_min"] + cloisons[0]["pose_incluse_max"]) / 2,
                    "prix_ajuste": 120.0
                },
                {
                    "categorie": "peinture",
                    "reference_id": peintures[0]["id"],
                    "reference_nom": peintures[0]["nom"],
                    "quantite": 45.0,
                    "unite": peintures[0]["unite"],
                    "prix_min": peintures[0]["prix_min"],
                    "prix_max": peintures[0]["prix_max"],
                    "prix_default": (peintures[0]["prix_min"] + peintures[0]["prix_max"]) / 2,
                    "prix_ajuste": 12.5
                },
                {
                    "categorie": "parquet",
                    "reference_id": parquets[2]["id"],  # AC3
                    "reference_nom": parquets[2]["nom"],
                    "quantite": 35.0,
                    "unite": parquets[2]["unite"],
                    "prix_min": parquets[2]["pose_incluse_min"],
                    "prix_max": parquets[2]["pose_incluse_max"],
                    "prix_default": (parquets[2]["pose_incluse_min"] + parquets[2]["pose_incluse_max"]) / 2,
                    "prix_ajuste": 45.0
                }
            ]
        }
        
        success, response, status_code = self.make_request("POST", "/devis", devis_data, use_auth=True)
        
        if success and status_code == 200:
            if "id" in response and "numero_devis" in response:
                # Vérifier les calculs
                expected_total_ht = (8000.0 * 1) + (120.0 * 15.5) + (12.5 * 45.0) + (45.0 * 35.0)
                expected_total_ttc = expected_total_ht * 1.20
                
                actual_total_ht = response["total_ht"]
                actual_total_ttc = response["total_ttc"]
                
                calc_ok = (abs(actual_total_ht - expected_total_ht) < 0.01 and 
                          abs(actual_total_ttc - expected_total_ttc) < 0.01)
                
                if calc_ok:
                    self.log_test("Création devis", True, 
                                f"Devis créé: {response['numero_devis']}, Total HT: {actual_total_ht}€, Total TTC: {actual_total_ttc}€")
                    return True, response["id"]
                else:
                    self.log_test("Création devis", False, 
                                f"Erreur de calcul - Attendu HT: {expected_total_ht}, Reçu: {actual_total_ht}")
                    return False, None
            else:
                self.log_test("Création devis", False, "ID ou numéro devis manquant", response)
                return False, None
        else:
            self.log_test("Création devis", False, f"Status: {status_code}", response)
            return False, None

    def test_6_list_devis(self, expected_devis_id: str = None):
        """Test 6: Lister les devis"""
        success, response, status_code = self.make_request("GET", "/devis", use_auth=True)
        
        if success and status_code == 200:
            if isinstance(response, list):
                found_devis = False
                if expected_devis_id:
                    found_devis = any(d["id"] == expected_devis_id for d in response)
                
                if expected_devis_id and found_devis:
                    self.log_test("Liste devis", True, f"{len(response)} devis trouvés, devis créé présent")
                elif not expected_devis_id:
                    self.log_test("Liste devis", True, f"{len(response)} devis trouvés")
                else:
                    self.log_test("Liste devis", False, f"Devis créé non trouvé dans la liste de {len(response)} devis")
                    return False
                return True
            else:
                self.log_test("Liste devis", False, "Réponse n'est pas une liste", response)
                return False
        else:
            self.log_test("Liste devis", False, f"Status: {status_code}", response)
            return False

    def test_7_get_devis_detail(self, devis_id: str):
        """Test 7: Récupérer le détail d'un devis"""
        success, response, status_code = self.make_request("GET", f"/devis/{devis_id}", use_auth=True)
        
        if success and status_code == 200:
            if "id" in response and "postes" in response:
                nb_postes = len(response["postes"])
                self.log_test("Détail devis", True, f"Devis récupéré avec {nb_postes} postes")
                return True
            else:
                self.log_test("Détail devis", False, "Structure de devis incomplète", response)
                return False
        else:
            self.log_test("Détail devis", False, f"Status: {status_code}", response)
            return False

    def test_8_update_devis(self, devis_id: str):
        """Test 8: Modifier le statut du devis"""
        update_data = {
            "statut": "valide",
            "client_nom": "Madame Martin - Rénovation Appartement (Validé)"
        }
        
        success, response, status_code = self.make_request("PATCH", f"/devis/{devis_id}", update_data, use_auth=True)
        
        if success and status_code == 200:
            if response.get("statut") == "valide":
                self.log_test("Modification devis", True, f"Statut mis à jour: {response['statut']}")
                return True
            else:
                self.log_test("Modification devis", False, f"Statut non mis à jour: {response.get('statut')}")
                return False
        else:
            self.log_test("Modification devis", False, f"Status: {status_code}", response)
            return False

    def test_9_generate_pdf(self, devis_id: str):
        """Test 9: Tester la génération PDF"""
        url = f"{self.base_url}/devis/{devis_id}/pdf"
        headers = self.headers.copy()
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'pdf' in content_type.lower() or len(response.content) > 1000:
                    self.log_test("Génération PDF", True, f"PDF généré ({len(response.content)} bytes)")
                    return True
                else:
                    self.log_test("Génération PDF", False, f"Contenu suspect: {content_type}, taille: {len(response.content)}")
                    return False
            else:
                self.log_test("Génération PDF", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Génération PDF", False, f"Erreur: {str(e)}")
            return False

    def test_10_delete_devis(self, devis_id: str):
        """Test 10: Supprimer le devis"""
        success, response, status_code = self.make_request("DELETE", f"/devis/{devis_id}", use_auth=True)
        
        if success and status_code == 200:
            self.log_test("Suppression devis", True, "Devis supprimé avec succès")
            return True
        else:
            self.log_test("Suppression devis", False, f"Status: {status_code}", response)
            return False

    def run_complete_test_scenario(self):
        """Exécuter le scénario de test complet"""
        print("=== DÉBUT DES TESTS API DEVIS RÉNOVATION ===")
        print(f"URL de base: {self.base_url}")
        print()
        
        # Test 1: Créer utilisateur
        if not self.test_1_register_user():
            print("❌ ARRÊT: Impossible de créer l'utilisateur")
            return False
        
        # Test 2: Se connecter
        if not self.test_2_login_user():
            print("❌ ARRÊT: Impossible de se connecter")
            return False
        
        # Test 3: Utilisateur courant
        if not self.test_3_get_current_user():
            print("❌ ARRÊT: Impossible de récupérer l'utilisateur courant")
            return False
        
        # Test 4: Données de référence
        if not self.test_4_reference_data():
            print("❌ ARRÊT: Données de référence manquantes")
            return False
        
        # Test 5: Créer devis
        devis_created, devis_id = self.test_5_create_devis()
        if not devis_created:
            print("❌ ARRÊT: Impossible de créer le devis")
            return False
        
        # Test 6: Lister devis
        if not self.test_6_list_devis(devis_id):
            print("⚠️  ATTENTION: Problème avec la liste des devis")
        
        # Test 7: Détail devis
        if not self.test_7_get_devis_detail(devis_id):
            print("⚠️  ATTENTION: Problème avec le détail du devis")
        
        # Test 8: Modifier devis
        if not self.test_8_update_devis(devis_id):
            print("⚠️  ATTENTION: Problème avec la modification du devis")
        
        # Test 9: Générer PDF
        if not self.test_9_generate_pdf(devis_id):
            print("⚠️  ATTENTION: Problème avec la génération PDF")
        
        # Test 10: Supprimer devis
        if not self.test_10_delete_devis(devis_id):
            print("⚠️  ATTENTION: Problème avec la suppression du devis")
        
        return True

    def print_summary(self):
        """Afficher le résumé des tests"""
        print("\n=== RÉSUMÉ DES TESTS ===")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total des tests: {total_tests}")
        print(f"Tests réussis: {passed_tests}")
        print(f"Tests échoués: {failed_tests}")
        print(f"Taux de réussite: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ TESTS ÉCHOUÉS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n=== FIN DES TESTS ===")
        
        return failed_tests == 0


def main():
    """Fonction principale"""
    tester = DevisAPITester()
    
    try:
        success = tester.run_complete_test_scenario()
        all_passed = tester.print_summary()
        
        if all_passed:
            print("\n🎉 TOUS LES TESTS SONT PASSÉS!")
            sys.exit(0)
        else:
            print("\n💥 CERTAINS TESTS ONT ÉCHOUÉ!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrompus par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 ERREUR CRITIQUE: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()