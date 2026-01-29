import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Acompte {
  pourcentage: number;
  delai_jours: number;
  description: string;
}

interface ConditionsPaiement {
  type: 'jours' | 'acomptes';
  delai_jours: number;
  acomptes: Acompte[];
}

interface EntrepriseInfo {
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string;
  tva_intracom: string;
  conditions_paiement: ConditionsPaiement;
  mentions_legales: string;
  garantie: string;
}

const DEFAULT_ENTREPRISE: EntrepriseInfo = {
  nom: '',
  adresse: '',
  code_postal: '',
  ville: '',
  telephone: '',
  email: '',
  siret: '',
  tva_intracom: '',
  conditions_paiement: {
    type: 'jours',
    delai_jours: 30,
    acomptes: [],
  },
  mentions_legales: `Les travaux seront réalisés selon les règles de l'art et conformément aux normes en vigueur.
Le présent devis est valable 30 jours à compter de sa date d'émission.
Tout retard de paiement entraînera l'application de pénalités de retard au taux légal en vigueur.`,
  garantie: 'Garantie décennale et responsabilité civile professionnelle.',
};

export default function ProfilScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [showEntrepriseForm, setShowEntrepriseForm] = useState(false);
  const [entreprise, setEntreprise] = useState<EntrepriseInfo>(DEFAULT_ENTREPRISE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load entreprise data
  const loadEntreprise = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/entreprise');
      if (response.data) {
        setEntreprise({
          ...DEFAULT_ENTREPRISE,
          ...response.data,
          conditions_paiement: {
            ...DEFAULT_ENTREPRISE.conditions_paiement,
            ...response.data.conditions_paiement,
          },
        });
      }
    } catch (error) {
      console.log('Aucun profil entreprise trouvé');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntreprise();
    }, [loadEntreprise])
  );

  const handleSaveEntreprise = async () => {
    try {
      setSaving(true);
      await api.put('/api/entreprise', entreprise);
      Alert.alert('Succès', 'Profil entreprise enregistré avec succès');
      setShowEntrepriseForm(false);
    } catch (error) {
      console.error('Error saving entreprise:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil entreprise');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const addAcompte = () => {
    const currentTotal = entreprise.conditions_paiement.acomptes.reduce(
      (sum, a) => sum + a.pourcentage, 0
    );
    const remaining = 100 - currentTotal;
    
    if (remaining <= 0) {
      Alert.alert('Erreur', 'Le total des acomptes ne peut pas dépasser 100%');
      return;
    }

    const newAcompte: Acompte = {
      pourcentage: Math.min(30, remaining),
      delai_jours: 0,
      description: entreprise.conditions_paiement.acomptes.length === 0 
        ? 'À la commande' 
        : `Versement ${entreprise.conditions_paiement.acomptes.length + 1}`,
    };

    setEntreprise({
      ...entreprise,
      conditions_paiement: {
        ...entreprise.conditions_paiement,
        acomptes: [...entreprise.conditions_paiement.acomptes, newAcompte],
      },
    });
  };

  const updateAcompte = (index: number, field: keyof Acompte, value: string | number) => {
    const newAcomptes = [...entreprise.conditions_paiement.acomptes];
    newAcomptes[index] = { ...newAcomptes[index], [field]: value };
    setEntreprise({
      ...entreprise,
      conditions_paiement: {
        ...entreprise.conditions_paiement,
        acomptes: newAcomptes,
      },
    });
  };

  const removeAcompte = (index: number) => {
    const newAcomptes = entreprise.conditions_paiement.acomptes.filter((_, i) => i !== index);
    setEntreprise({
      ...entreprise,
      conditions_paiement: {
        ...entreprise.conditions_paiement,
        acomptes: newAcomptes,
      },
    });
  };

  const renderEntrepriseForm = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.formContainer}
    >
      <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowEntrepriseForm(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.formTitle}>Mon Entreprise</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Informations générales */}
        <Card>
          <Text style={styles.sectionLabel}>Informations générales</Text>
          
          <Text style={styles.inputLabel}>Nom de l'entreprise *</Text>
          <TextInput
            style={styles.input}
            value={entreprise.nom}
            onChangeText={(text) => setEntreprise({ ...entreprise, nom: text })}
            placeholder="Ex: Rénovation Pro"
          />

          <Text style={styles.inputLabel}>Adresse</Text>
          <TextInput
            style={styles.input}
            value={entreprise.adresse}
            onChangeText={(text) => setEntreprise({ ...entreprise, adresse: text })}
            placeholder="Ex: 123 rue du Commerce"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Code postal</Text>
              <TextInput
                style={styles.input}
                value={entreprise.code_postal}
                onChangeText={(text) => setEntreprise({ ...entreprise, code_postal: text })}
                placeholder="75001"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TextInput
                style={styles.input}
                value={entreprise.ville}
                onChangeText={(text) => setEntreprise({ ...entreprise, ville: text })}
                placeholder="Paris"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={entreprise.telephone}
            onChangeText={(text) => setEntreprise({ ...entreprise, telephone: text })}
            placeholder="01 23 45 67 89"
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={entreprise.email}
            onChangeText={(text) => setEntreprise({ ...entreprise, email: text })}
            placeholder="contact@entreprise.fr"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Card>

        {/* Informations légales */}
        <Card>
          <Text style={styles.sectionLabel}>Informations légales</Text>
          
          <Text style={styles.inputLabel}>N° SIRET</Text>
          <TextInput
            style={styles.input}
            value={entreprise.siret}
            onChangeText={(text) => setEntreprise({ ...entreprise, siret: text })}
            placeholder="123 456 789 00012"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>N° TVA Intracommunautaire</Text>
          <TextInput
            style={styles.input}
            value={entreprise.tva_intracom}
            onChangeText={(text) => setEntreprise({ ...entreprise, tva_intracom: text })}
            placeholder="FR12345678901"
            autoCapitalize="characters"
          />
        </Card>

        {/* Conditions de paiement */}
        <Card>
          <Text style={styles.sectionLabel}>Conditions de paiement par défaut</Text>
          
          <View style={styles.paymentTypeContainer}>
            <TouchableOpacity
              style={[
                styles.paymentTypeButton,
                entreprise.conditions_paiement.type === 'jours' && styles.paymentTypeActive
              ]}
              onPress={() => setEntreprise({
                ...entreprise,
                conditions_paiement: { ...entreprise.conditions_paiement, type: 'jours' }
              })}
            >
              <Text style={[
                styles.paymentTypeText,
                entreprise.conditions_paiement.type === 'jours' && styles.paymentTypeTextActive
              ]}>
                Paiement à terme
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentTypeButton,
                entreprise.conditions_paiement.type === 'acomptes' && styles.paymentTypeActive
              ]}
              onPress={() => setEntreprise({
                ...entreprise,
                conditions_paiement: { ...entreprise.conditions_paiement, type: 'acomptes' }
              })}
            >
              <Text style={[
                styles.paymentTypeText,
                entreprise.conditions_paiement.type === 'acomptes' && styles.paymentTypeTextActive
              ]}>
                Avec acomptes
              </Text>
            </TouchableOpacity>
          </View>

          {entreprise.conditions_paiement.type === 'jours' ? (
            <View>
              <Text style={styles.inputLabel}>Délai de paiement (jours)</Text>
              <TextInput
                style={styles.input}
                value={String(entreprise.conditions_paiement.delai_jours)}
                onChangeText={(text) => setEntreprise({
                  ...entreprise,
                  conditions_paiement: {
                    ...entreprise.conditions_paiement,
                    delai_jours: parseInt(text) || 0
                  }
                })}
                keyboardType="numeric"
                placeholder="30"
              />
            </View>
          ) : (
            <View>
              <Text style={styles.acompteInfo}>
                Définissez vos acomptes. Le total doit faire 100%.
              </Text>
              
              {entreprise.conditions_paiement.acomptes.map((acompte, index) => (
                <View key={index} style={styles.acompteCard}>
                  <View style={styles.acompteHeader}>
                    <Text style={styles.acompteTitle}>Acompte {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeAcompte(index)}>
                      <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={acompte.description}
                    onChangeText={(text) => updateAcompte(index, 'description', text)}
                    placeholder="Ex: À la commande"
                  />
                  
                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.inputLabel}>Pourcentage (%)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(acompte.pourcentage)}
                        onChangeText={(text) => updateAcompte(index, 'pourcentage', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholder="30"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.inputLabel}>Délai (jours)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(acompte.delai_jours)}
                        onChangeText={(text) => updateAcompte(index, 'delai_jours', parseInt(text) || 0)}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </View>
                </View>
              ))}
              
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>
                  Total: {entreprise.conditions_paiement.acomptes.reduce((sum, a) => sum + a.pourcentage, 0)}%
                </Text>
              </View>
              
              <TouchableOpacity style={styles.addButton} onPress={addAcompte}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.addButtonText}>Ajouter un acompte</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Mentions légales */}
        <Card>
          <Text style={styles.sectionLabel}>Mentions légales</Text>
          
          <Text style={styles.inputLabel}>Texte des mentions légales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={entreprise.mentions_legales}
            onChangeText={(text) => setEntreprise({ ...entreprise, mentions_legales: text })}
            placeholder="Mentions légales..."
            multiline
            numberOfLines={5}
          />

          <Text style={styles.inputLabel}>Garantie</Text>
          <TextInput
            style={styles.input}
            value={entreprise.garantie}
            onChangeText={(text) => setEntreprise({ ...entreprise, garantie: text })}
            placeholder="Ex: Garantie décennale..."
          />
        </Card>

        <Button
          title={saving ? "Enregistrement..." : "Enregistrer"}
          onPress={handleSaveEntreprise}
          disabled={saving}
          style={styles.saveButton}
        />
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );

  if (showEntrepriseForm) {
    return renderEntrepriseForm();
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.surface} />
        </View>
        <Text style={styles.name}>{user?.nom}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>

        <Card>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowEntrepriseForm(true)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="business-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Mon Entreprise</Text>
              <Text style={styles.menuSubtext}>
                {entreprise.nom || 'Configurer les informations de votre entreprise'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Card>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Informations personnelles</Text>
              <Text style={styles.menuSubtext}>Modifier votre profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Card>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Paramètres</Text>
              <Text style={styles.menuSubtext}>Préférences de l'application</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>

        <Card>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuText}>Aide & Support</Text>
              <Text style={styles.menuSubtext}>FAQ et contact</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.section}>
        <Button
          title="Déconnexion"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.surface,
    opacity: 0.9,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs / 2,
  },
  menuSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  // Form styles
  formContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  formScroll: {
    flex: 1,
    padding: Spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paymentTypeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  paymentTypeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  paymentTypeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentTypeTextActive: {
    color: Colors.surface,
  },
  acompteInfo: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  acompteCard: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  acompteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  acompteTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
