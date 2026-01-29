import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { devisService, PosteCreate } from '../../services/devisService';
import { referenceService } from '../../services/referenceService';
import { Ionicons } from '@expo/vector-icons';
import { useDevisStore } from '../../store/devisStore';

type Category = 'cuisine' | 'cloison' | 'peinture' | 'parquet';

export default function NouveauDevisScreen() {
  const router = useRouter();
  const { devisId } = useLocalSearchParams<{ devisId?: string }>();
  const { setFormData, clearFormData } = useDevisStore();
  const [loading, setLoading] = useState(false);
  const [editingDevisId, setEditingDevisId] = useState<string | null>(null);
  
  // Client data
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [clientAdresse, setClientAdresse] = useState('');
  const [clientCodePostal, setClientCodePostal] = useState('');
  const [clientVille, setClientVille] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  const [tvaTaux, setTvaTaux] = useState('20');
  
  // Selected categories
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  
  // Form data for each category
  const [cuisineData, setCuisineData] = useState({ 
    quantite: '', 
    type: '',
    pose_et_fourniture: true, // true = Pose + Fourniture, false = Pose seule
    extras: [] as string[], // IDs des extras sélectionnés
  });
  const [cloisonData, setCloisonData] = useState({ 
    quantite: '', 
    type: '',
    pose_et_fourniture: true, // true = Pose + Fourniture, false = Pose seule
    extras: [] as string[],
  });
  const [peintureData, setPeintureData] = useState({ 
    quantite_mur: '', 
    quantite_plafond: '', 
    type_mur: '', 
    type_plafond: '',
    extras: [] as string[],
  });
  const [parquetData, setParquetData] = useState({ 
    quantite: '', 
    type: '',
    type_pose: '', // ID du type de pose (flottante, collée, clouée)
    pose_et_fourniture: true, // true = Pose + Fourniture, false = Pose seule
    extras: [] as string[],
  });
  
  // Cuisine - Plan de travail
  const [planTravailData, setPlanTravailData] = useState({
    quantite: '',
    type: '',
    pose_et_fourniture: true,
    pose_offerte: false, // Pose offerte pour le plan de travail
  });
  
  // Cuisine - Nombre d'appareils électroménagers
  const [nbAppareils, setNbAppareils] = useState('1');
  
  // Poses offertes pour les extras (par catégorie et par extra ID)
  const [posesOffertes, setPosesOffertes] = useState<{[key: string]: boolean}>({});
  
  // Services
  const [servicesData, setServicesData] = useState({
    livraison: {
      enabled: false,
      km: '',
      tarifKm: 0.55,
      forfaitCustom: '',
      nbLivraisons: '1',
      offert: false,
    },
    deplacement: {
      enabled: false,
      km: '',
      tarifKm: 0.55,
      forfaitCustom: '',
      nbDeplacements: '1',
      afficherQuantite: false, // false = quantité 1 (forfait), true = quantité = nb déplacements
      offert: false,
    },
    debarras: {
      enabled: false,
      depot: { enabled: false, volume: '', tarifM3: 30 }, // 10-50 €/m³
      gravats: { enabled: false, volume: '', tarifM3: 75 }, // 50-100 €/m³
      encombrants: { enabled: false, volume: '', tarifM3: 60 }, // 45-75 €/m³
    },
  });
  
  // Reference data
  const [cuisineTypes, setCuisineTypes] = useState<any[]>([]);
  const [plansTravail, setPlansTravail] = useState<any[]>([]);
  const [cloisons, setCloisons] = useState<any[]>([]);
  const [cloisonOptions, setCloisonOptions] = useState<any[]>([]);
  const [selectedCloisonOptions, setSelectedCloisonOptions] = useState<{[key: string]: string}>({}); // {optionId: superficie}
  const [peintures, setPeintures] = useState<any[]>([]);
  const [parquets, setParquets] = useState<any[]>([]);
  const [parquetPoses, setParquetPoses] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  // Reset form or load existing devis data
  useFocusEffect(
    useCallback(() => {
      if (devisId) {
        // Mode édition : charger le devis existant
        loadExistingDevis(devisId);
      } else {
        // Mode création : reset du formulaire
        resetForm();
      }
    }, [devisId])
  );

  const resetForm = () => {
    setEditingDevisId(null);
    setClientNom('');
    setClientPrenom('');
    setClientAdresse('');
    setClientCodePostal('');
    setClientVille('');
    setClientTelephone('');
    setClientEmail('');
    setTvaTaux('20');
    setSelectedCategories([]);
    setCuisineData({ quantite: '', type: '', pose_et_fourniture: true, extras: [] });
    setCloisonData({ quantite: '', type: '', pose_et_fourniture: true, extras: [] });
    setPeintureData({ quantite_mur: '', quantite_plafond: '', type_mur: '', type_plafond: '', extras: [] });
    setParquetData({ quantite: '', type: '', type_pose: '', pose_et_fourniture: true, extras: [] });
    setPlanTravailData({ quantite: '', type: '', pose_et_fourniture: true, pose_offerte: false });
    setNbAppareils('1');
    setSelectedCloisonOptions({});
    setPosesOffertes({});
    setServicesData({
      livraison: { enabled: false, km: '', tarifKm: 0.55, forfaitCustom: '', nbLivraisons: '1', offert: false },
      deplacement: { enabled: false, km: '', tarifKm: 0.55, forfaitCustom: '', nbDeplacements: '1', afficherQuantite: false, offert: false },
      debarras: {
        enabled: false,
        depot: { enabled: false, volume: '', tarifM3: 30 },
        gravats: { enabled: false, volume: '', tarifM3: 75 },
        encombrants: { enabled: false, volume: '', tarifM3: 60 },
      },
    });
    clearFormData();
  };

  const loadExistingDevis = async (id: string) => {
    try {
      setLoading(true);
      const devis = await devisService.get(id);
      setEditingDevisId(id);
      
      // Charger les infos client
      if (devis.client) {
        setClientNom(devis.client.nom || '');
        setClientPrenom(devis.client.prenom || '');
        setClientAdresse(devis.client.adresse || '');
        setClientCodePostal(devis.client.code_postal || '');
        setClientVille(devis.client.ville || '');
        setClientTelephone(devis.client.telephone || '');
        setClientEmail(devis.client.email || '');
      }
      
      setTvaTaux(String(devis.tva_taux));
      
      // Analyser les postes pour reconstituer les données du formulaire
      const categories = new Set<Category>();
      
      // Variables temporaires pour collecter les données
      let newCuisineData = { quantite: '', type: '', pose_et_fourniture: true, extras: [] as string[] };
      let newCloisonData = { quantite: '', type: '', pose_et_fourniture: true, extras: [] as string[] };
      let newPeintureData = { quantite_mur: '', quantite_plafond: '', type_mur: '', type_plafond: '', extras: [] as string[] };
      let newParquetData = { quantite: '', type: '', type_pose: '', pose_et_fourniture: true, extras: [] as string[] };
      let newPlanTravailData = { quantite: '', type: '', pose_et_fourniture: true };
      let newNbAppareils = '1';
      let newSelectedCloisonOptions: {[key: string]: string} = {};
      
      devis.postes.forEach((poste: any) => {
        const categorie = poste.categorie;
        const refNom = poste.reference_nom || '';
        const refId = poste.reference_id || '';
        const quantite = String(poste.quantite);
        
        if (categorie === 'cuisine') {
          categories.add('cuisine');
          
          // Détecter si c'est un plan de travail
          if (refNom.toLowerCase().includes('plan de travail') || refNom.toLowerCase().includes('granit') || refNom.toLowerCase().includes('quartz') || refNom.toLowerCase().includes('stratifié') || refNom.toLowerCase().includes('bois massif')) {
            newPlanTravailData.quantite = quantite;
            newPlanTravailData.type = refId;
            newPlanTravailData.pose_et_fourniture = !refNom.toLowerCase().includes('pose seule');
          }
          // Détecter le nombre d'appareils
          else if (refNom.toLowerCase().includes('appareil') || refNom.toLowerCase().includes('électroménager')) {
            newNbAppareils = quantite;
          }
          // Sinon c'est le type de cuisine principal
          else if (!refNom.toLowerCase().includes('extra')) {
            newCuisineData.quantite = quantite;
            newCuisineData.type = refId;
            newCuisineData.pose_et_fourniture = refNom.includes('Pose + Fourniture') || refNom.includes('(Fourniture)');
          }
          // Extras cuisine
          else {
            newCuisineData.extras.push(refId);
          }
        }
        
        else if (categorie === 'cloison') {
          categories.add('cloison');
          
          // Détecter les options/suppléments de cloison
          if (refNom.toLowerCase().includes('supplément') || refNom.toLowerCase().includes('hydrofuge') || refNom.toLowerCase().includes('phonique') || refNom.toLowerCase().includes('feu')) {
            newSelectedCloisonOptions[refId] = quantite;
          }
          // Détecter les extras (bloc-porte, etc.)
          else if (refNom.toLowerCase().includes('bloc-porte') || refNom.toLowerCase().includes('porte')) {
            newCloisonData.extras.push(refId);
          }
          // Sinon c'est le type de cloison principal
          else {
            newCloisonData.quantite = quantite;
            newCloisonData.type = refId;
            newCloisonData.pose_et_fourniture = refNom.includes('Pose + Fourniture') || !refNom.includes('Fourniture seule');
          }
        }
        
        else if (categorie === 'peinture') {
          categories.add('peinture');
          
          // Détecter mur ou plafond
          if (refNom.toLowerCase().includes('mur')) {
            newPeintureData.quantite_mur = quantite;
            newPeintureData.type_mur = refId;
          } else if (refNom.toLowerCase().includes('plafond')) {
            newPeintureData.quantite_plafond = quantite;
            newPeintureData.type_plafond = refId;
          } else {
            // Extras peinture
            newPeintureData.extras.push(refId);
          }
        }
        
        else if (categorie === 'parquet') {
          categories.add('parquet');
          
          // Détecter les extras (dépose, plinthes, etc.)
          if (refNom.toLowerCase().includes('dépose') || refNom.toLowerCase().includes('plinthe') || refNom.toLowerCase().includes('quart')) {
            newParquetData.extras.push(refId);
          }
          // Sinon c'est le type de parquet principal
          else if (!newParquetData.type) {
            newParquetData.quantite = quantite;
            newParquetData.type = refId;
            newParquetData.pose_et_fourniture = !refNom.toLowerCase().includes('pose seule');
            
            // Essayer de détecter le type de pose dans le nom
            if (refNom.toLowerCase().includes('flottante')) {
              // On cherchera l'ID correspondant dans parquetPoses
            } else if (refNom.toLowerCase().includes('collée')) {
              // Idem
            } else if (refNom.toLowerCase().includes('clouée')) {
              // Idem
            }
          }
        }
      });
      
      // Appliquer les données collectées
      setSelectedCategories(Array.from(categories));
      setCuisineData(newCuisineData);
      setCloisonData(newCloisonData);
      setPeintureData(newPeintureData);
      setParquetData(newParquetData);
      setPlanTravailData(newPlanTravailData);
      setNbAppareils(newNbAppareils);
      setSelectedCloisonOptions(newSelectedCloisonOptions);
      
      Alert.alert(
        'Mode Modification',
        `Devis ${devis.numero_devis} chargé. Toutes les données ont été restaurées. Vous pouvez les modifier puis enregistrer.`
      );
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      Alert.alert('Erreur', 'Impossible de charger le devis');
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [
        cuisineTypesData, 
        plansTravailData,
        cloisonsData, 
        cloisonOptionsData,
        peinturesData, 
        parquetsData, 
        parquetPosesData,
        extrasData
      ] = await Promise.all([
        referenceService.getCuisineTypes(),
        referenceService.getPlansTravail(),
        referenceService.getCloisons(),
        referenceService.getCloisonOptions(),
        referenceService.getPeintures(),
        referenceService.getParquets(),
        referenceService.getParquetPoses(),
        referenceService.getExtras(),
      ]);
      setCuisineTypes(cuisineTypesData);
      setPlansTravail(plansTravailData);
      setCloisons(cloisonsData);
      setCloisonOptions(cloisonOptionsData);
      setPeintures(peinturesData.filter((p: any) => p.type === 'support'));
      setParquets(parquetsData);
      setParquetPoses(parquetPosesData);
      setExtras(extrasData);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const toggleCategory = (category: Category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const getCategoryIcon = (category: Category) => {
    switch (category) {
      case 'cuisine':
        return 'restaurant';
      case 'cloison':
        return 'grid';
      case 'peinture':
        return 'color-palette';
      case 'parquet':
        return 'square';
    }
  };

  const getCategoryLabel = (category: Category) => {
    switch (category) {
      case 'cuisine':
        return 'Cuisine';
      case 'cloison':
        return 'Cloison';
      case 'peinture':
        return 'Peinture';
      case 'parquet':
        return 'Parquet';
    }
  };

  const handleSubmit = async () => {
    console.log('=== DEBUT VALIDATION ===');
    console.log('Client nom:', clientNom);
    console.log('TVA:', tvaTaux);
    console.log('Categories selectionnees:', selectedCategories);
    
    if (!clientNom) {
      Alert.alert('Erreur', 'Veuillez saisir le nom du client');
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie');
      return;
    }

    const postes: PosteCreate[] = [];
    const errors: string[] = [];

    // Build postes based on selected categories
    if (selectedCategories.includes('cuisine')) {
      console.log('Cuisine data:', cuisineData);
      if (!cuisineData.quantite || !cuisineData.type) {
        errors.push('Cuisine: Veuillez remplir le type et la longueur');
      } else {
        const type = cuisineTypes.find((t) => t.id === cuisineData.type);
        if (type) {
          // Les tarifs cuisine sont des coûts globaux, on les divise par 5m pour obtenir un prix/m linéaire moyen
          if (cuisineData.pose_et_fourniture) {
            // Pose + Fourniture : prix total (cout + pose)
            const prix_min = (type.cout_min + type.pose_min) / 5;
            const prix_max = (type.cout_max + type.pose_max) / 5;
            const prix_default = (prix_min + prix_max) / 2;
            postes.push({
              categorie: 'cuisine',
              reference_id: type.id,
              reference_nom: `${type.nom} (Pose + Fourniture)`,
              quantite: parseFloat(cuisineData.quantite),
              unite: 'm linéaire',
              prix_min,
              prix_max,
              prix_default,
              prix_ajuste: prix_default,
            });
          } else {
            // Pose seule
            const prix_min = type.pose_min / 5;
            const prix_max = type.pose_max / 5;
            const prix_default = (prix_min + prix_max) / 2;
            postes.push({
              categorie: 'cuisine',
              reference_id: type.id,
              reference_nom: `${type.nom} (Pose seule)`,
              quantite: parseFloat(cuisineData.quantite),
              unite: 'm linéaire',
              prix_min,
              prix_max,
              prix_default,
              prix_ajuste: prix_default,
            });
          }
          
          // Ajouter les extras cuisine sélectionnés
          const longueurCuisine = parseFloat(cuisineData.quantite);
          const nombreAppareils = parseInt(nbAppareils) || 1;
          
          cuisineData.extras.forEach(extraId => {
            const extra = extras.find(e => e.id === extraId);
            if (extra) {
              const extra_prix_default = (extra.cout_min + extra.cout_max) / 2;
              // Déterminer la quantité selon l'unité
              let quantite = 1; // Par défaut: forfait
              if (extra.unite === 'm linéaire' || extra.unite.includes('linéaire')) {
                quantite = longueurCuisine;
              } else if (extra.unite === 'm²') {
                quantite = longueurCuisine; // Surface approximative pour crédence
              } else if (extra.unite === 'appareil') {
                quantite = nombreAppareils; // Utiliser le nombre d'appareils saisi
              }
              // sinon prestation, pose, unité, pièce, point = 1
              
              postes.push({
                categorie: 'cuisine',
                reference_id: extra.id,
                reference_nom: extra.nom,
                quantite,
                unite: extra.unite,
                prix_min: extra.cout_min,
                prix_max: extra.cout_max,
                prix_default: extra_prix_default,
                prix_ajuste: extra_prix_default,
              });
            }
          });
          
          // Ajouter le plan de travail si sélectionné
          if (planTravailData.type && planTravailData.quantite) {
            const planType = plansTravail.find(p => p.id === planTravailData.type);
            if (planType) {
              let prix_min, prix_max;
              if (planTravailData.pose_et_fourniture) {
                prix_min = planType.fourniture_pose_min;
                prix_max = planType.fourniture_pose_max;
              } else {
                prix_min = planType.pose_seule_min;
                prix_max = planType.pose_seule_max;
              }
              const prix_default = (prix_min + prix_max) / 2;
              postes.push({
                categorie: 'cuisine',
                reference_id: planType.id,
                reference_nom: `Plan de travail ${planType.nom} (${planTravailData.pose_et_fourniture ? 'Pose + Fourniture' : 'Pose seule'})`,
                quantite: parseFloat(planTravailData.quantite),
                unite: planType.unite,
                prix_min,
                prix_max,
                prix_default,
                prix_ajuste: prix_default,
              });
            }
          }
        }
      }
    }

    if (selectedCategories.includes('cloison')) {
      console.log('Cloison data:', cloisonData);
      console.log('Options cloison sélectionnées:', selectedCloisonOptions);
      if (!cloisonData.quantite || !cloisonData.type) {
        errors.push('Cloison: Veuillez remplir le type et la surface');
      } else {
        const type = cloisons.find((t) => t.id === cloisonData.type);
        if (type) {
          // Pose + Fourniture = pose_incluse, Pose seule = pose_seule
          if (cloisonData.pose_et_fourniture) {
            const prix_min = type.pose_incluse_min;
            const prix_max = type.pose_incluse_max;
            const prix_default = (prix_min + prix_max) / 2;
            postes.push({
              categorie: 'cloison',
              reference_id: type.id,
              reference_nom: `${type.nom} (Pose + Fourniture)`,
              quantite: parseFloat(cloisonData.quantite),
              unite: 'm²',
              prix_min,
              prix_max,
              prix_default,
              prix_ajuste: prix_default,
            });
            
            // Ajouter les options/suppléments cloison sélectionnés (uniquement si Pose + Fourniture)
            Object.entries(selectedCloisonOptions).forEach(([optionId, superficie]) => {
              const option = cloisonOptions.find(o => o.id === optionId);
              if (option && (option.supplement_min > 0 || option.supplement_max > 0)) {
                const surfaceOption = parseFloat(superficie) || parseFloat(cloisonData.quantite);
                const supp_prix_default = (option.supplement_min + option.supplement_max) / 2;
                postes.push({
                  categorie: 'cloison',
                  reference_id: option.id,
                  reference_nom: option.nom,
                  quantite: surfaceOption,
                  unite: option.unite,
                  prix_min: option.supplement_min,
                  prix_max: option.supplement_max,
                  prix_default: supp_prix_default,
                  prix_ajuste: supp_prix_default,
                });
              }
            });
          } else {
            const prix_min = type.pose_seule_min;
            const prix_max = type.pose_seule_max;
            const prix_default = (prix_min + prix_max) / 2;
            postes.push({
              categorie: 'cloison',
              reference_id: type.id,
              reference_nom: `${type.nom} (Pose seule)`,
              quantite: parseFloat(cloisonData.quantite),
              unite: 'm²',
              prix_min,
              prix_max,
              prix_default,
              prix_ajuste: prix_default,
            });
          }
          
          // Ajouter les extras sélectionnés
          const surfaceCloison = parseFloat(cloisonData.quantite);
          cloisonData.extras.forEach(extraId => {
            const extra = extras.find(e => e.id === extraId);
            if (extra) {
              const extra_prix_default = (extra.cout_min + extra.cout_max) / 2;
              // Les extras cloison sont généralement par pièce ou par point
              const quantite = (extra.unite === 'm²') ? surfaceCloison : 1;
              postes.push({
                categorie: 'cloison',
                reference_id: extra.id,
                reference_nom: extra.nom,
                quantite,
                unite: extra.unite,
                prix_min: extra.cout_min,
                prix_max: extra.cout_max,
                prix_default: extra_prix_default,
                prix_ajuste: extra_prix_default,
              });
            }
          });
        }
      }
    }

    if (selectedCategories.includes('peinture')) {
      console.log('Peinture data:', peintureData);
      let hasAtLeastOne = false;
      
      // Peinture mur
      if (peintureData.quantite_mur && peintureData.type_mur) {
        const type = peintures.find((t) => t.id === peintureData.type_mur);
        if (type) {
          hasAtLeastOne = true;
          const prix_default = (type.prix_min + type.prix_max) / 2;
          postes.push({
            categorie: 'peinture',
            reference_id: type.id,
            reference_nom: `${type.nom}`,
            quantite: parseFloat(peintureData.quantite_mur),
            unite: type.unite,
            prix_min: type.prix_min,
            prix_max: type.prix_max,
            prix_default,
            prix_ajuste: prix_default,
          });
        }
      }
      
      // Peinture plafond
      if (peintureData.quantite_plafond && peintureData.type_plafond) {
        const type = peintures.find((t) => t.id === peintureData.type_plafond);
        if (type) {
          hasAtLeastOne = true;
          const prix_default = (type.prix_min + type.prix_max) / 2;
          postes.push({
            categorie: 'peinture',
            reference_id: type.id,
            reference_nom: `${type.nom}`,
            quantite: parseFloat(peintureData.quantite_plafond),
            unite: type.unite,
            prix_min: type.prix_min,
            prix_max: type.prix_max,
            prix_default,
            prix_ajuste: prix_default,
          });
        }
      }
      
      // Ajouter les extras peinture sélectionnés
      if (hasAtLeastOne) {
        const totalSurface = (parseFloat(peintureData.quantite_mur) || 0) + (parseFloat(peintureData.quantite_plafond) || 0);
        peintureData.extras.forEach(extraId => {
          const extra = extras.find(e => e.id === extraId);
          if (extra) {
            const extra_prix_default = (extra.cout_min + extra.cout_max) / 2;
            // Quantité selon l'unité
            const quantite = (extra.unite === 'm²') ? totalSurface : 1;
            postes.push({
              categorie: 'peinture',
              reference_id: extra.id,
              reference_nom: extra.nom,
              quantite,
              unite: extra.unite,
              prix_min: extra.cout_min,
              prix_max: extra.cout_max,
              prix_default: extra_prix_default,
              prix_ajuste: extra_prix_default,
            });
          }
        });
      }
      
      if (!hasAtLeastOne) {
        errors.push('Peinture: Veuillez remplir au moins mur OU plafond');
      }
    }

    if (selectedCategories.includes('parquet')) {
      console.log('Parquet data:', parquetData);
      if (!parquetData.quantite || !parquetData.type) {
        errors.push('Parquet: Veuillez remplir le type et la surface');
      } else if (!parquetData.pose_et_fourniture && !parquetData.type_pose) {
        errors.push('Parquet: Veuillez sélectionner un type de pose');
      } else {
        const type = parquets.find((t) => t.id === parquetData.type);
        const typePose = parquetPoses.find((p) => p.id === parquetData.type_pose);
        
        if (type) {
          if (parquetData.pose_et_fourniture) {
            // Pose + Fourniture = fourniture + type de pose choisi
            if (!typePose) {
              errors.push('Parquet: Veuillez sélectionner un type de pose');
            } else {
              const prix_min = type.fourniture_min + typePose.prix_min;
              const prix_max = type.fourniture_max + typePose.prix_max;
              const prix_default = (prix_min + prix_max) / 2;
              postes.push({
                categorie: 'parquet',
                reference_id: type.id,
                reference_nom: `${type.nom} - ${typePose.nom} (Pose + Fourniture)`,
                quantite: parseFloat(parquetData.quantite),
                unite: type.unite,
                prix_min,
                prix_max,
                prix_default,
                prix_ajuste: prix_default,
              });
            }
          } else {
            // Pose seule = uniquement le prix du type de pose
            if (!typePose) {
              errors.push('Parquet: Veuillez sélectionner un type de pose');
            } else {
              const prix_min = typePose.prix_min;
              const prix_max = typePose.prix_max;
              const prix_default = (prix_min + prix_max) / 2;
              postes.push({
                categorie: 'parquet',
                reference_id: type.id,
                reference_nom: `${type.nom} - ${typePose.nom} (Pose seule)`,
                quantite: parseFloat(parquetData.quantite),
                unite: type.unite,
                prix_min,
                prix_max,
                prix_default,
                prix_ajuste: prix_default,
              });
            }
          }
          
          // Ajouter les extras sélectionnés
          const surfaceParquet = parseFloat(parquetData.quantite);
          // Calcul du périmètre approximatif (√surface × 4) pour les plinthes
          const perimetreParquet = Math.round(Math.sqrt(surfaceParquet) * 4);
          
          parquetData.extras.forEach(extraId => {
            const extra = extras.find(e => e.id === extraId);
            if (extra) {
              const extra_prix_default = (extra.cout_min + extra.cout_max) / 2;
              // Déterminer la quantité selon l'unité
              let quantite = surfaceParquet; // Par défaut: m²
              if (extra.unite === 'm linéaire' || extra.unite.includes('linéaire')) {
                quantite = perimetreParquet; // Périmètre pour les plinthes
              } else if (extra.unite === 'prestation' || extra.unite === 'pièce' || extra.unite === 'point' || extra.unite === 'unité' || extra.unite === 'pose' || extra.unite === 'appareil') {
                quantite = 1; // Forfait
              }
              
              postes.push({
                categorie: 'parquet',
                reference_id: extra.id,
                reference_nom: extra.nom,
                quantite,
                unite: extra.unite,
                prix_min: extra.cout_min,
                prix_max: extra.cout_max,
                prix_default: extra_prix_default,
                prix_ajuste: extra_prix_default,
              });
            }
          });
        }
      }
    }

    console.log('Erreurs:', errors);
    console.log('Postes crees:', postes);

    if (errors.length > 0) {
      Alert.alert('Erreur', errors.join('\n\n'));
      return;
    }

    if (postes.length === 0) {
      Alert.alert('Erreur', 'Veuillez remplir au moins un poste de travaux');
      return;
    }

    // Build client object
    const clientData = {
      nom: clientNom,
      prenom: clientPrenom,
      adresse: clientAdresse,
      code_postal: clientCodePostal,
      ville: clientVille,
      telephone: clientTelephone,
      email: clientEmail,
    };

    // Store data in zustand store
    console.log('Stockage des donnees dans le store...');
    setFormData({
      client: clientData,
      tvaTaux: parseFloat(tvaTaux),
      postes,
      editingDevisId: editingDevisId, // Passer l'ID du devis si en mode modification
      posesOffertes: posesOffertes, // Passer les extras offerts
      planTravailPoseOfferte: planTravailData.pose_offerte, // Pose plan de travail offerte
    });

    // Navigate to recapitulatif
    console.log('Navigation vers recapitulatif...');
    router.push('/(tabs)/recapitulatif');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <Card>
            <View style={styles.clientRow}>
              <View style={styles.clientHalf}>
                <Input
                  label="Nom *"
                  value={clientNom}
                  onChangeText={setClientNom}
                  placeholder="Dupont"
                />
              </View>
              <View style={styles.clientHalf}>
                <Input
                  label="Prénom"
                  value={clientPrenom}
                  onChangeText={setClientPrenom}
                  placeholder="Jean"
                />
              </View>
            </View>
            
            <Input
              label="Adresse"
              value={clientAdresse}
              onChangeText={setClientAdresse}
              placeholder="123 rue de la Paix"
            />
            
            <View style={styles.clientRow}>
              <View style={styles.clientThird}>
                <Input
                  label="Code postal"
                  value={clientCodePostal}
                  onChangeText={setClientCodePostal}
                  placeholder="75001"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.clientTwoThird}>
                <Input
                  label="Ville"
                  value={clientVille}
                  onChangeText={setClientVille}
                  placeholder="Paris"
                />
              </View>
            </View>
            
            <Input
              label="Téléphone"
              value={clientTelephone}
              onChangeText={setClientTelephone}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
            />
            
            <Input
              label="Email"
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Input
              label="Taux de TVA (%)"
              value={tvaTaux}
              onChangeText={setTvaTaux}
              keyboardType="numeric"
              placeholder="20"
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionner les catégories de travaux</Text>
          <View style={styles.categoriesGrid}>
            {(['cuisine', 'cloison', 'peinture', 'parquet'] as Category[]).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryCard,
                  selectedCategories.includes(category) && styles.categoryCardSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={32}
                  color={
                    selectedCategories.includes(category)
                      ? Colors.primary
                      : Colors.textLight
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategories.includes(category) && styles.categoryTextSelected,
                  ]}
                >
                  {getCategoryLabel(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedCategories.includes('cuisine') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisine</Text>
            <Card>
              <Text style={styles.fieldLabel}>Type de cuisine</Text>
              <View style={styles.typesList}>
                {cuisineTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      cuisineData.type === type.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => setCuisineData({ ...cuisineData, type: type.id })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        cuisineData.type === type.id && styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Options</Text>
              <TouchableOpacity
                style={styles.switchContainer}
                onPress={() => setCuisineData({ ...cuisineData, pose_et_fourniture: !cuisineData.pose_et_fourniture })}
              >
                <Text style={styles.switchLabel}>
                  {cuisineData.pose_et_fourniture ? 'Pose + Fourniture' : 'Pose seule'}
                </Text>
                <View style={[styles.switch, cuisineData.pose_et_fourniture && styles.switchActive]}>
                  <View style={[styles.switchThumb, cuisineData.pose_et_fourniture && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
              
              <Input
                label="Longueur (mètres linéaires)"
                value={cuisineData.quantite}
                onChangeText={(value) => setCuisineData({ ...cuisineData, quantite: value })}
                keyboardType="numeric"
                placeholder="5"
              />
              
              {/* Plan de travail */}
              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Plan de travail (optionnel)</Text>
              <View style={styles.typesList}>
                {plansTravail.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      planTravailData.type === type.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => setPlanTravailData({ ...planTravailData, type: type.id })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        planTravailData.type === type.id && styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {planTravailData.type && (
                <>
                  <TouchableOpacity
                    style={styles.switchContainer}
                    onPress={() => setPlanTravailData({ ...planTravailData, pose_et_fourniture: !planTravailData.pose_et_fourniture })}
                  >
                    <Text style={styles.switchLabel}>
                      {planTravailData.pose_et_fourniture ? 'Plan: Pose + Fourniture' : 'Plan: Pose seule'}
                    </Text>
                    <View style={[styles.switch, planTravailData.pose_et_fourniture && styles.switchActive]}>
                      <View style={[styles.switchThumb, planTravailData.pose_et_fourniture && styles.switchThumbActive]} />
                    </View>
                  </TouchableOpacity>
                  
                  {/* Option pose offerte pour le plan de travail en pose seule */}
                  {!planTravailData.pose_et_fourniture && (
                    <TouchableOpacity
                      style={styles.poseOfferteContainerFull}
                      onPress={() => setPlanTravailData({ ...planTravailData, pose_offerte: !planTravailData.pose_offerte })}
                    >
                      <View style={[styles.checkboxSmall, planTravailData.pose_offerte && styles.checkboxChecked]}>
                        {planTravailData.pose_offerte && (
                          <Ionicons name="checkmark" size={12} color={Colors.surface} />
                        )}
                      </View>
                      <Text style={styles.poseOfferteLabel}>Pose offerte (affichée mais non comptabilisée)</Text>
                    </TouchableOpacity>
                  )}
                  
                  <Input
                    label="Surface plan de travail (m²)"
                    value={planTravailData.quantite}
                    onChangeText={(value) => setPlanTravailData({ ...planTravailData, quantite: value })}
                    keyboardType="numeric"
                    placeholder="2"
                  />
                </>
              )}
              
              {/* Nombre d'appareils électroménagers */}
              <Input
                label="Nombre d'appareils électroménagers (hors hotte et plaque)"
                value={nbAppareils}
                onChangeText={setNbAppareils}
                keyboardType="numeric"
                placeholder="1"
              />
              
              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Extras (optionnel)</Text>
              {extras.filter(e => e.categorie === 'cuisine').map((extra) => (
                <View key={extra.id} style={styles.extraRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      const newExtras = cuisineData.extras.includes(extra.id)
                        ? cuisineData.extras.filter(id => id !== extra.id)
                        : [...cuisineData.extras, extra.id];
                      setCuisineData({ ...cuisineData, extras: newExtras });
                    }}
                  >
                    <View style={[styles.checkbox, cuisineData.extras.includes(extra.id) && styles.checkboxChecked]}>
                      {cuisineData.extras.includes(extra.id) && (
                        <Ionicons name="checkmark" size={16} color={Colors.surface} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{extra.nom}</Text>
                  </TouchableOpacity>
                  {cuisineData.extras.includes(extra.id) && (
                    <TouchableOpacity
                      style={styles.poseOfferteContainer}
                      onPress={() => setPosesOffertes({ ...posesOffertes, [`cuisine_${extra.id}`]: !posesOffertes[`cuisine_${extra.id}`] })}
                    >
                      <View style={[styles.checkboxSmall, posesOffertes[`cuisine_${extra.id}`] && styles.checkboxChecked]}>
                        {posesOffertes[`cuisine_${extra.id}`] && (
                          <Ionicons name="checkmark" size={12} color={Colors.surface} />
                        )}
                      </View>
                      <Text style={styles.poseOfferteLabel}>Offert</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {selectedCategories.includes('cloison') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloison</Text>
            <Card>
              <Text style={styles.fieldLabel}>Type de cloison</Text>
              <View style={styles.typesList}>
                {cloisons.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      cloisonData.type === type.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => setCloisonData({ ...cloisonData, type: type.id })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        cloisonData.type === type.id && styles.typeButtonTextSelected,
                      ]}
                    >
                      {type.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Options</Text>
              <TouchableOpacity
                style={styles.switchContainer}
                onPress={() => setCloisonData({ ...cloisonData, pose_et_fourniture: !cloisonData.pose_et_fourniture })}
              >
                <Text style={styles.switchLabel}>
                  {cloisonData.pose_et_fourniture ? 'Pose + Fourniture' : 'Pose seule'}
                </Text>
                <View style={[styles.switch, cloisonData.pose_et_fourniture && styles.switchActive]}>
                  <View style={[styles.switchThumb, cloisonData.pose_et_fourniture && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
              
              {/* Options/Suppléments cloison (visibles uniquement si Pose + Fourniture) */}
              {cloisonData.pose_et_fourniture && cloisonOptions.length > 0 && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Suppléments matériau</Text>
                  {cloisonOptions.map((option) => (
                    <View key={option.id}>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => {
                          const newOptions = { ...selectedCloisonOptions };
                          if (newOptions[option.id]) {
                            delete newOptions[option.id];
                          } else {
                            newOptions[option.id] = cloisonData.quantite || ''; // Pré-remplir avec la surface cloison
                          }
                          setSelectedCloisonOptions(newOptions);
                        }}
                      >
                        <View style={[styles.checkbox, selectedCloisonOptions[option.id] !== undefined && styles.checkboxChecked]}>
                          {selectedCloisonOptions[option.id] !== undefined && (
                            <Ionicons name="checkmark" size={16} color={Colors.surface} />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>
                          {option.nom} (+{option.supplement_min}-{option.supplement_max}€/m²)
                        </Text>
                      </TouchableOpacity>
                      {/* Champ de superficie si l'option est cochée */}
                      {selectedCloisonOptions[option.id] !== undefined && (
                        <View style={{ marginLeft: 32, marginBottom: 8 }}>
                          <Input
                            label={`Surface ${option.nom} (m²)`}
                            value={selectedCloisonOptions[option.id]}
                            onChangeText={(value) => {
                              setSelectedCloisonOptions({
                                ...selectedCloisonOptions,
                                [option.id]: value
                              });
                            }}
                            keyboardType="numeric"
                            placeholder={cloisonData.quantite || "Surface"}
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
              
              <Input
                label="Surface (m²)"
                value={cloisonData.quantite}
                onChangeText={(value) => setCloisonData({ ...cloisonData, quantite: value })}
                keyboardType="numeric"
                placeholder="20"
              />
              
              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Extras (optionnel)</Text>
              {extras.filter(e => e.categorie === 'cloison').map((extra) => (
                <View key={extra.id} style={styles.extraRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      const newExtras = cloisonData.extras.includes(extra.id)
                        ? cloisonData.extras.filter(id => id !== extra.id)
                        : [...cloisonData.extras, extra.id];
                      setCloisonData({ ...cloisonData, extras: newExtras });
                    }}
                  >
                    <View style={[styles.checkbox, cloisonData.extras.includes(extra.id) && styles.checkboxChecked]}>
                      {cloisonData.extras.includes(extra.id) && (
                        <Ionicons name="checkmark" size={16} color={Colors.surface} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{extra.nom}</Text>
                  </TouchableOpacity>
                  {cloisonData.extras.includes(extra.id) && (
                    <TouchableOpacity
                      style={styles.poseOfferteContainer}
                      onPress={() => setPosesOffertes({ ...posesOffertes, [`cloison_${extra.id}`]: !posesOffertes[`cloison_${extra.id}`] })}
                    >
                      <View style={[styles.checkboxSmall, posesOffertes[`cloison_${extra.id}`] && styles.checkboxChecked]}>
                        {posesOffertes[`cloison_${extra.id}`] && (
                          <Ionicons name="checkmark" size={12} color={Colors.surface} />
                        )}
                      </View>
                      <Text style={styles.poseOfferteLabel}>Offert</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {selectedCategories.includes('peinture') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peinture</Text>
            <Card>
              <Text style={styles.fieldLabel}>Peinture mur</Text>
              <View style={styles.typesList}>
                {peintures.map((type) => (
                  type.nom.toLowerCase().includes('mur') && (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        peintureData.type_mur === type.id && styles.typeButtonSelected,
                      ]}
                      onPress={() => setPeintureData({ ...peintureData, type_mur: type.id })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          peintureData.type_mur === type.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.nom}
                      </Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
              <Input
                label="Surface mur (m²)"
                value={peintureData.quantite_mur}
                onChangeText={(value) => setPeintureData({ ...peintureData, quantite_mur: value })}
                keyboardType="numeric"
                placeholder="30"
              />

              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Peinture plafond</Text>
              <View style={styles.typesList}>
                {peintures.map((type) => (
                  type.nom.toLowerCase().includes('plafond') && (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        peintureData.type_plafond === type.id && styles.typeButtonSelected,
                      ]}
                      onPress={() => setPeintureData({ ...peintureData, type_plafond: type.id })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          peintureData.type_plafond === type.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.nom}
                      </Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
              <Input
                label="Surface plafond (m²)"
                value={peintureData.quantite_plafond}
                onChangeText={(value) => setPeintureData({ ...peintureData, quantite_plafond: value })}
                keyboardType="numeric"
                placeholder="20"
              />
              
              <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Extras (optionnel)</Text>
              {extras.filter(e => e.categorie === 'peinture').map((extra) => (
                <View key={extra.id} style={styles.extraRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      const newExtras = peintureData.extras.includes(extra.id)
                        ? peintureData.extras.filter(id => id !== extra.id)
                        : [...peintureData.extras, extra.id];
                      setPeintureData({ ...peintureData, extras: newExtras });
                    }}
                  >
                    <View style={[styles.checkbox, peintureData.extras.includes(extra.id) && styles.checkboxChecked]}>
                      {peintureData.extras.includes(extra.id) && (
                        <Ionicons name="checkmark" size={16} color={Colors.surface} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{extra.nom}</Text>
                  </TouchableOpacity>
                  {peintureData.extras.includes(extra.id) && (
                    <TouchableOpacity
                      style={styles.poseOfferteContainer}
                      onPress={() => setPosesOffertes({ ...posesOffertes, [`peinture_${extra.id}`]: !posesOffertes[`peinture_${extra.id}`] })}
                    >
                      <View style={[styles.checkboxSmall, posesOffertes[`peinture_${extra.id}`] && styles.checkboxChecked]}>
                        {posesOffertes[`peinture_${extra.id}`] && (
                          <Ionicons name="checkmark" size={12} color={Colors.surface} />
                        )}
                      </View>
                      <Text style={styles.poseOfferteLabel}>Offert</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {selectedCategories.includes('parquet') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parquet</Text>
            <Card>
              {/* 1. Type de pose (en premier) */}
              <Text style={styles.fieldLabel}>Type de pose *</Text>
              <View style={styles.typesList}>
                {parquetPoses.map((pose) => (
                  <TouchableOpacity
                    key={pose.id}
                    style={[
                      styles.typeButton,
                      parquetData.type_pose === pose.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => setParquetData({ ...parquetData, type_pose: pose.id })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        parquetData.type_pose === pose.id && styles.typeButtonTextSelected,
                      ]}
                    >
                      {pose.nom} ({pose.prix_min}-{pose.prix_max}€/m²)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 2. Surface */}
              <Input
                label="Surface (m²)"
                value={parquetData.quantite}
                onChangeText={(value) => setParquetData({ ...parquetData, quantite: value })}
                keyboardType="numeric"
                placeholder="30"
              />
              
              {/* 3. Pose seule / Pose + Fourniture (switch) */}
              <TouchableOpacity
                style={[styles.switchContainer, { marginTop: Spacing.md }]}
                onPress={() => setParquetData({ ...parquetData, pose_et_fourniture: !parquetData.pose_et_fourniture })}
              >
                <Text style={styles.switchLabel}>
                  {parquetData.pose_et_fourniture ? 'Pose + Fourniture' : 'Pose seule'}
                </Text>
                <View style={[styles.switch, parquetData.pose_et_fourniture && styles.switchActive]}>
                  <View style={[styles.switchThumb, parquetData.pose_et_fourniture && styles.switchThumbActive]} />
                </View>
              </TouchableOpacity>
              
              {/* 4. Type de parquet (seulement si Pose + Fourniture) */}
              {parquetData.pose_et_fourniture && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Type de parquet *</Text>
                  <View style={styles.typesList}>
                    {parquets.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeButton,
                          parquetData.type === type.id && styles.typeButtonSelected,
                        ]}
                        onPress={() => setParquetData({ ...parquetData, type: type.id })}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            parquetData.type === type.id && styles.typeButtonTextSelected,
                          ]}
                        >
                          {type.nom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              
              {/* 5. Options/Extras (en bas) */}
              <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Options (optionnel)</Text>
              {extras.filter(e => e.categorie === 'parquet').map((extra) => (
                <View key={extra.id} style={styles.extraRow}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => {
                      const newExtras = parquetData.extras.includes(extra.id)
                        ? parquetData.extras.filter(id => id !== extra.id)
                        : [...parquetData.extras, extra.id];
                      setParquetData({ ...parquetData, extras: newExtras });
                    }}
                  >
                    <View style={[styles.checkbox, parquetData.extras.includes(extra.id) && styles.checkboxChecked]}>
                      {parquetData.extras.includes(extra.id) && (
                        <Ionicons name="checkmark" size={16} color={Colors.surface} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{extra.nom}</Text>
                  </TouchableOpacity>
                  {parquetData.extras.includes(extra.id) && (
                    <TouchableOpacity
                      style={styles.poseOfferteContainer}
                      onPress={() => setPosesOffertes({ ...posesOffertes, [`parquet_${extra.id}`]: !posesOffertes[`parquet_${extra.id}`] })}
                    >
                      <View style={[styles.checkboxSmall, posesOffertes[`parquet_${extra.id}`] && styles.checkboxChecked]}>
                        {posesOffertes[`parquet_${extra.id}`] && (
                          <Ionicons name="checkmark" size={12} color={Colors.surface} />
                        )}
                      </View>
                      <Text style={styles.poseOfferteLabel}>Offert</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Section Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services additionnels</Text>
          <Card>
            {/* LIVRAISON */}
            <TouchableOpacity
              style={styles.serviceHeader}
              onPress={() => setServicesData({
                ...servicesData,
                livraison: { ...servicesData.livraison, enabled: !servicesData.livraison.enabled }
              })}
            >
              <View style={[styles.checkbox, servicesData.livraison.enabled && styles.checkboxChecked]}>
                {servicesData.livraison.enabled && (
                  <Ionicons name="checkmark" size={16} color={Colors.surface} />
                )}
              </View>
              <Text style={styles.serviceTitle}>Livraison</Text>
            </TouchableOpacity>
            
            {servicesData.livraison.enabled && (
              <View style={styles.serviceContent}>
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Distance (km)"
                      value={servicesData.livraison.km}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        livraison: { ...servicesData.livraison, km: v }
                      })}
                      keyboardType="numeric"
                      placeholder="50"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Nb de livraisons"
                      value={servicesData.livraison.nbLivraisons}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        livraison: { ...servicesData.livraison, nbLivraisons: v }
                      })}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                </View>
                
                <Text style={styles.sliderLabel}>
                  Tarif/km: {servicesData.livraison.tarifKm.toFixed(2)} €
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={0.6}
                  value={servicesData.livraison.tarifKm}
                  onValueChange={(v) => setServicesData({
                    ...servicesData,
                    livraison: { ...servicesData.livraison, tarifKm: v }
                  })}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  step={0.01}
                />
                
                <View style={styles.calculResultBox}>
                  <Text style={styles.calculResultLabel}>
                    Forfait calculé: {(parseFloat(servicesData.livraison.km || '0') * servicesData.livraison.tarifKm * parseFloat(servicesData.livraison.nbLivraisons || '1')).toFixed(2)} €
                  </Text>
                  <Input
                    label="Forfait personnalisé (€)"
                    value={servicesData.livraison.forfaitCustom}
                    onChangeText={(v) => setServicesData({
                      ...servicesData,
                      livraison: { ...servicesData.livraison, forfaitCustom: v }
                    })}
                    keyboardType="numeric"
                    placeholder="Laisser vide pour utiliser le calcul"
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.poseOfferteContainerFull}
                  onPress={() => setServicesData({
                    ...servicesData,
                    livraison: { ...servicesData.livraison, offert: !servicesData.livraison.offert }
                  })}
                >
                  <View style={[styles.checkboxSmall, servicesData.livraison.offert && styles.checkboxChecked]}>
                    {servicesData.livraison.offert && (
                      <Ionicons name="checkmark" size={12} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.poseOfferteLabel}>Offert</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.serviceDivider} />
            
            {/* DÉPLACEMENT */}
            <TouchableOpacity
              style={styles.serviceHeader}
              onPress={() => setServicesData({
                ...servicesData,
                deplacement: { ...servicesData.deplacement, enabled: !servicesData.deplacement.enabled }
              })}
            >
              <View style={[styles.checkbox, servicesData.deplacement.enabled && styles.checkboxChecked]}>
                {servicesData.deplacement.enabled && (
                  <Ionicons name="checkmark" size={16} color={Colors.surface} />
                )}
              </View>
              <Text style={styles.serviceTitle}>Déplacement</Text>
            </TouchableOpacity>
            
            {servicesData.deplacement.enabled && (
              <View style={styles.serviceContent}>
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Distance (km)"
                      value={servicesData.deplacement.km}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        deplacement: { ...servicesData.deplacement, km: v }
                      })}
                      keyboardType="numeric"
                      placeholder="30"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Nb de déplacements"
                      value={servicesData.deplacement.nbDeplacements}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        deplacement: { ...servicesData.deplacement, nbDeplacements: v }
                      })}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                </View>
                
                <Text style={styles.sliderLabel}>
                  Tarif/km: {servicesData.deplacement.tarifKm.toFixed(2)} €
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.5}
                  maximumValue={0.6}
                  value={servicesData.deplacement.tarifKm}
                  onValueChange={(v) => setServicesData({
                    ...servicesData,
                    deplacement: { ...servicesData.deplacement, tarifKm: v }
                  })}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  step={0.01}
                />
                
                <View style={styles.calculResultBox}>
                  <Text style={styles.calculResultLabel}>
                    Forfait calculé: {(parseFloat(servicesData.deplacement.km || '0') * servicesData.deplacement.tarifKm * parseFloat(servicesData.deplacement.nbDeplacements || '1')).toFixed(2)} €
                  </Text>
                  <Input
                    label="Forfait personnalisé (€)"
                    value={servicesData.deplacement.forfaitCustom}
                    onChangeText={(v) => setServicesData({
                      ...servicesData,
                      deplacement: { ...servicesData.deplacement, forfaitCustom: v }
                    })}
                    keyboardType="numeric"
                    placeholder="Laisser vide pour utiliser le calcul"
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.switchContainer}
                  onPress={() => setServicesData({
                    ...servicesData,
                    deplacement: { ...servicesData.deplacement, afficherQuantite: !servicesData.deplacement.afficherQuantite }
                  })}
                >
                  <Text style={styles.switchLabel}>
                    {servicesData.deplacement.afficherQuantite 
                      ? `Afficher quantité: ${servicesData.deplacement.nbDeplacements}` 
                      : 'Afficher quantité: 1 (forfait)'}
                  </Text>
                  <View style={[styles.switch, servicesData.deplacement.afficherQuantite && styles.switchActive]}>
                    <View style={[styles.switchThumb, servicesData.deplacement.afficherQuantite && styles.switchThumbActive]} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.poseOfferteContainerFull}
                  onPress={() => setServicesData({
                    ...servicesData,
                    deplacement: { ...servicesData.deplacement, offert: !servicesData.deplacement.offert }
                  })}
                >
                  <View style={[styles.checkboxSmall, servicesData.deplacement.offert && styles.checkboxChecked]}>
                    {servicesData.deplacement.offert && (
                      <Ionicons name="checkmark" size={12} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.poseOfferteLabel}>Offert</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.serviceDivider} />
            
            {/* DÉBARRAS */}
            <TouchableOpacity
              style={styles.serviceHeader}
              onPress={() => setServicesData({
                ...servicesData,
                debarras: { ...servicesData.debarras, enabled: !servicesData.debarras.enabled }
              })}
            >
              <View style={[styles.checkbox, servicesData.debarras.enabled && styles.checkboxChecked]}>
                {servicesData.debarras.enabled && (
                  <Ionicons name="checkmark" size={16} color={Colors.surface} />
                )}
              </View>
              <Text style={styles.serviceTitle}>Débarras en déchèterie</Text>
            </TouchableOpacity>
            
            {servicesData.debarras.enabled && (
              <View style={styles.serviceContent}>
                {/* Dépôt en déchèterie */}
                <TouchableOpacity
                  style={styles.debarrasTypeHeader}
                  onPress={() => setServicesData({
                    ...servicesData,
                    debarras: {
                      ...servicesData.debarras,
                      depot: { ...servicesData.debarras.depot, enabled: !servicesData.debarras.depot.enabled }
                    }
                  })}
                >
                  <View style={[styles.checkboxSmall, servicesData.debarras.depot.enabled && styles.checkboxChecked]}>
                    {servicesData.debarras.depot.enabled && (
                      <Ionicons name="checkmark" size={12} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.debarrasTypeLabel}>Dépôt en déchèterie (10-50 €/m³)</Text>
                </TouchableOpacity>
                
                {servicesData.debarras.depot.enabled && (
                  <View style={styles.debarrasTypeContent}>
                    <Input
                      label="Volume estimé (m³)"
                      value={servicesData.debarras.depot.volume}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          depot: { ...servicesData.debarras.depot, volume: v }
                        }
                      })}
                      keyboardType="numeric"
                      placeholder="2"
                    />
                    <Text style={styles.sliderLabel}>
                      Tarif: {servicesData.debarras.depot.tarifM3} €/m³ → Forfait: {(parseFloat(servicesData.debarras.depot.volume || '0') * servicesData.debarras.depot.tarifM3).toFixed(2)} €
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={10}
                      maximumValue={50}
                      value={servicesData.debarras.depot.tarifM3}
                      onValueChange={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          depot: { ...servicesData.debarras.depot, tarifM3: Math.round(v) }
                        }
                      })}
                      minimumTrackTintColor={Colors.primary}
                      maximumTrackTintColor={Colors.border}
                      step={1}
                    />
                  </View>
                )}
                
                {/* Gravats lourds */}
                <TouchableOpacity
                  style={styles.debarrasTypeHeader}
                  onPress={() => setServicesData({
                    ...servicesData,
                    debarras: {
                      ...servicesData.debarras,
                      gravats: { ...servicesData.debarras.gravats, enabled: !servicesData.debarras.gravats.enabled }
                    }
                  })}
                >
                  <View style={[styles.checkboxSmall, servicesData.debarras.gravats.enabled && styles.checkboxChecked]}>
                    {servicesData.debarras.gravats.enabled && (
                      <Ionicons name="checkmark" size={12} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.debarrasTypeLabel}>Gravats lourds (50-100 €/m³)</Text>
                </TouchableOpacity>
                
                {servicesData.debarras.gravats.enabled && (
                  <View style={styles.debarrasTypeContent}>
                    <Input
                      label="Volume estimé (m³)"
                      value={servicesData.debarras.gravats.volume}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          gravats: { ...servicesData.debarras.gravats, volume: v }
                        }
                      })}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                    <Text style={styles.sliderLabel}>
                      Tarif: {servicesData.debarras.gravats.tarifM3} €/m³ → Forfait: {(parseFloat(servicesData.debarras.gravats.volume || '0') * servicesData.debarras.gravats.tarifM3).toFixed(2)} €
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={50}
                      maximumValue={100}
                      value={servicesData.debarras.gravats.tarifM3}
                      onValueChange={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          gravats: { ...servicesData.debarras.gravats, tarifM3: Math.round(v) }
                        }
                      })}
                      minimumTrackTintColor={Colors.primary}
                      maximumTrackTintColor={Colors.border}
                      step={1}
                    />
                  </View>
                )}
                
                {/* Encombrants */}
                <TouchableOpacity
                  style={styles.debarrasTypeHeader}
                  onPress={() => setServicesData({
                    ...servicesData,
                    debarras: {
                      ...servicesData.debarras,
                      encombrants: { ...servicesData.debarras.encombrants, enabled: !servicesData.debarras.encombrants.enabled }
                    }
                  })}
                >
                  <View style={[styles.checkboxSmall, servicesData.debarras.encombrants.enabled && styles.checkboxChecked]}>
                    {servicesData.debarras.encombrants.enabled && (
                      <Ionicons name="checkmark" size={12} color={Colors.surface} />
                    )}
                  </View>
                  <Text style={styles.debarrasTypeLabel}>Encombrants (45-75 €/m³)</Text>
                </TouchableOpacity>
                
                {servicesData.debarras.encombrants.enabled && (
                  <View style={styles.debarrasTypeContent}>
                    <Input
                      label="Volume estimé (m³)"
                      value={servicesData.debarras.encombrants.volume}
                      onChangeText={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          encombrants: { ...servicesData.debarras.encombrants, volume: v }
                        }
                      })}
                      keyboardType="numeric"
                      placeholder="3"
                    />
                    <Text style={styles.sliderLabel}>
                      Tarif: {servicesData.debarras.encombrants.tarifM3} €/m³ → Forfait: {(parseFloat(servicesData.debarras.encombrants.volume || '0') * servicesData.debarras.encombrants.tarifM3).toFixed(2)} €
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={45}
                      maximumValue={75}
                      value={servicesData.debarras.encombrants.tarifM3}
                      onValueChange={(v) => setServicesData({
                        ...servicesData,
                        debarras: {
                          ...servicesData.debarras,
                          encombrants: { ...servicesData.debarras.encombrants, tarifM3: Math.round(v) }
                        }
                      })}
                      minimumTrackTintColor={Colors.primary}
                      maximumTrackTintColor={Colors.border}
                      step={1}
                    />
                  </View>
                )}
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.7}
            pointerEvents="auto"
          >
            <Text style={styles.submitButtonText}>
              Continuer vers le récapitulatif
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  categoryText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textLight,
  },
  categoryTextSelected: {
    color: Colors.primary,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  typesList: {
    marginTop: Spacing.md,
  },
  typeButton: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  typeButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  typeButtonText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  typeButtonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  switchLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    padding: 2,
  },
  switchActive: {
    backgroundColor: Colors.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  switchThumbActive: {
    marginLeft: 22,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.surface,
  },
  clientRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  clientHalf: {
    flex: 1,
  },
  clientThird: {
    flex: 1,
  },
  clientTwoThird: {
    flex: 2,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poseOfferteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  poseOfferteContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poseOfferteLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontStyle: 'italic',
  },
});
