import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
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
  const { setFormData } = useDevisStore();
  const [loading, setLoading] = useState(false);
  const [clientNom, setClientNom] = useState('');
  const [tvaTaux, setTvaTaux] = useState('20');
  
  // Selected categories
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  
  // Form data for each category
  const [cuisineData, setCuisineData] = useState({ quantite: '', type: '' });
  const [cloisonData, setCloisonData] = useState({ quantite: '', type: '' });
  const [peintureData, setPeintureData] = useState({ 
    quantite_mur: '', 
    quantite_plafond: '', 
    type_mur: '', 
    type_plafond: '' 
  });
  const [parquetData, setParquetData] = useState({ quantite: '', type: '' });
  
  // Reference data
  const [cuisineTypes, setCuisineTypes] = useState<any[]>([]);
  const [cloisons, setCloisons] = useState<any[]>([]);
  const [peintures, setPeintures] = useState<any[]>([]);
  const [parquets, setParquets] = useState<any[]>([]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [cuisineTypesData, cloisonsData, peinturesData, parquetsData] = await Promise.all([
        referenceService.getCuisineTypes(),
        referenceService.getCloisons(),
        referenceService.getPeintures(),
        referenceService.getParquets(),
      ]);
      setCuisineTypes(cuisineTypesData);
      setCloisons(cloisonsData);
      setPeintures(peinturesData.filter((p: any) => p.type === 'support'));
      setParquets(parquetsData);
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
          const prix_unitaire_min = type.cout_min / 5;
          const prix_unitaire_max = type.cout_max / 5;
          const prix_default = (prix_unitaire_min + prix_unitaire_max) / 2;
          postes.push({
            categorie: 'cuisine',
            reference_id: type.id,
            reference_nom: type.nom,
            quantite: parseFloat(cuisineData.quantite),
            unite: '€/m linéaire',
            prix_min: prix_unitaire_min,
            prix_max: prix_unitaire_max,
            prix_default,
            prix_ajuste: prix_default,
          });
        }
      }
    }

    if (selectedCategories.includes('cloison')) {
      console.log('Cloison data:', cloisonData);
      if (!cloisonData.quantite || !cloisonData.type) {
        errors.push('Cloison: Veuillez remplir le type et la surface');
      } else {
        const type = cloisons.find((t) => t.id === cloisonData.type);
        if (type) {
          const prix_default = (type.pose_incluse_min + type.pose_incluse_max) / 2;
          postes.push({
            categorie: 'cloison',
            reference_id: type.id,
            reference_nom: type.nom,
            quantite: parseFloat(cloisonData.quantite),
            unite: '€/m²',
            prix_min: type.pose_incluse_min,
            prix_max: type.pose_incluse_max,
            prix_default,
            prix_ajuste: prix_default,
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
            reference_nom: `${type.nom} (mur)`,
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
            reference_nom: `${type.nom} (plafond)`,
            quantite: parseFloat(peintureData.quantite_plafond),
            unite: type.unite,
            prix_min: type.prix_min,
            prix_max: type.prix_max,
            prix_default,
            prix_ajuste: prix_default,
          });
        }
      }
      
      if (!hasAtLeastOne) {
        errors.push('Peinture: Veuillez remplir au moins mur OU plafond');
      }
    }

    if (selectedCategories.includes('parquet')) {
      console.log('Parquet data:', parquetData);
      if (!parquetData.quantite || !parquetData.type) {
        errors.push('Parquet: Veuillez remplir le type et la surface');
      } else {
        const type = parquets.find((t) => t.id === parquetData.type);
        if (type) {
          const prix_default = (type.pose_incluse_min + type.pose_incluse_max) / 2;
          postes.push({
            categorie: 'parquet',
            reference_id: type.id,
            reference_nom: type.nom,
            quantite: parseFloat(parquetData.quantite),
            unite: type.unite,
            prix_min: type.pose_incluse_min,
            prix_max: type.pose_incluse_max,
            prix_default,
            prix_ajuste: prix_default,
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

    // Store data in zustand store
    console.log('Stockage des donnees dans le store...');
    setFormData({
      clientNom,
      tvaTaux: parseFloat(tvaTaux),
      postes,
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
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <Card>
            <Input
              label="Nom du client"
              value={clientNom}
              onChangeText={setClientNom}
              placeholder="Jean Dupont"
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
              <Input
                label="Longueur (mètres linéaires)"
                value={cuisineData.quantite}
                onChangeText={(value) => setCuisineData({ ...cuisineData, quantite: value })}
                keyboardType="numeric"
                placeholder="5"
              />
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
              <Input
                label="Surface (m²)"
                value={cloisonData.quantite}
                onChangeText={(value) => setCloisonData({ ...cloisonData, quantite: value })}
                keyboardType="numeric"
                placeholder="20"
              />
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
            </Card>
          </View>
        )}

        {selectedCategories.includes('parquet') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parquet</Text>
            <Card>
              <Text style={styles.fieldLabel}>Type de parquet</Text>
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
              <Input
                label="Surface (m²)"
                value={parquetData.quantite}
                onChangeText={(value) => setParquetData({ ...parquetData, quantite: value })}
                keyboardType="numeric"
                placeholder="30"
              />
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              Alert.alert('Test', 'Le bouton fonctionne !');
              console.log('BOUTON CLIQUÉ !');
              handleSubmit();
            }}
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
});
