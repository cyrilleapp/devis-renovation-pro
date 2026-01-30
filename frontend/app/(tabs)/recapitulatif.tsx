import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { devisService, PosteCreate } from '../../services/devisService';
import { useDevisStore, ClientInfo } from '../../store/devisStore';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function RecapitulatifScreen() {
  const router = useRouter();
  const { formData, clearFormData } = useDevisStore();
  const { isAuthenticated } = useAuthStore();
  
  const [postes, setPostes] = useState<PosteCreate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formData) {
      Alert.alert('Erreur', 'Aucune donnée de devis trouvée');
      router.back();
      return;
    }
    setPostes(formData.postes);
  }, [formData]);

  const updatePostePrice = (index: number, newPrice: number) => {
    const newPostes = [...postes];
    newPostes[index].prix_ajuste = newPrice;
    setPostes(newPostes);
  };

  const calculateTotal = () => {
    // Les prix sont déjà en TTC - pas de calcul HT/TVA supplémentaire
    let totalTTC = 0;
    postes.forEach(poste => {
      // Ne pas comptabiliser les postes offerts
      if (!poste.offert) {
        const prix = poste.prix_ajuste || poste.prix_default;
        totalTTC += poste.quantite * prix;
      }
    });
    return { totalTTC };
  };

  const handleCreate = async () => {
    if (!formData) return;
    
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez vous connecter pour créer un devis',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    
    setLoading(true);
    try {
      let devis;
      const isEditing = !!formData.editingDevisId;
      
      if (isEditing) {
        // Mode modification : utiliser PUT
        devis = await devisService.update(formData.editingDevisId!, {
          client: formData.client,
          tva_taux: formData.tvaTaux,
          postes,
        });
        clearFormData();
        Alert.alert('Succès', 'Devis modifié avec succès!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
              setTimeout(() => router.push(`/devis/${devis.id}`), 100);
            },
          },
        ]);
      } else {
        // Mode création : utiliser POST
        devis = await devisService.create({
          client: formData.client,
          tva_taux: formData.tvaTaux,
          postes,
        });
        clearFormData();
        Alert.alert('Succès', 'Devis créé avec succès!', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)');
              setTimeout(() => router.push(`/devis/${devis.id}`), 100);
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error creating devis:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la création du devis');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getClientDisplayName = () => {
    if (!formData?.client) return 'Client';
    const { prenom, nom } = formData.client;
    return prenom ? `${prenom} ${nom}` : nom;
  };

  if (!formData) {
    return null;
  }

  const { totalTTC } = calculateTotal();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Récapitulatif du devis</Text>
        <Text style={styles.subtitle}>Ajustez les prix avec les curseurs</Text>
      </View>

      <Card>
        <Text style={styles.clientHeader}>Client</Text>
        <Text style={styles.infoLabel}>{getClientDisplayName()}</Text>
        {formData.client.adresse && (
          <Text style={styles.infoDetail}>{formData.client.adresse}</Text>
        )}
        {(formData.client.code_postal || formData.client.ville) && (
          <Text style={styles.infoDetail}>
            {formData.client.code_postal} {formData.client.ville}
          </Text>
        )}
        {formData.client.telephone && (
          <Text style={styles.infoDetail}>Tél: {formData.client.telephone}</Text>
        )}
        {formData.client.email && (
          <Text style={styles.infoDetail}>Email: {formData.client.email}</Text>
        )}
        <Text style={[styles.infoLabel, { marginTop: Spacing.sm }]}>TVA: {formData.tvaTaux}%</Text>
      </Card>

      <Text style={styles.sectionTitle}>Postes de travaux</Text>

      {postes.map((poste, index) => {
        const currentPrice = poste.prix_ajuste || poste.prix_default;
        const isOffert = poste.offert;
        return (
          <Card key={index} style={isOffert ? styles.cardOffert : undefined}>
            <View style={styles.posteHeader}>
              <Text style={styles.posteCategorie}>{poste.categorie.toUpperCase()}</Text>
              {isOffert && <Text style={styles.offertBadge}>OFFERT</Text>}
            </View>
            <Text style={[styles.posteNom, isOffert && styles.textOffert]}>{poste.reference_nom}</Text>
            <Text style={styles.posteQuantite}>
              {poste.quantite} {poste.unite}
            </Text>

            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Prix unitaire ajustable</Text>
              <Text style={[styles.priceValue, isOffert && styles.textOffert]}>
                {formatPrice(currentPrice)}
              </Text>
              
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Min: {formatPrice(poste.prix_min)}</Text>
                <Text style={styles.sliderLabel}>Max: {formatPrice(poste.prix_max)}</Text>
              </View>
              
              <Slider
                style={styles.slider}
                minimumValue={poste.prix_min}
                maximumValue={poste.prix_max}
                value={currentPrice}
                onValueChange={(value) => updatePostePrice(index, value)}
                minimumTrackTintColor={isOffert ? Colors.textLight : Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={isOffert ? Colors.textLight : Colors.primary}
                step={1}
              />
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={[styles.totalValue, isOffert && styles.textOffert]}>
                {isOffert ? 'Offert' : formatPrice(poste.quantite * currentPrice)}
              </Text>
            </View>
          </Card>
        );
      })}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total HT</Text>
          <Text style={styles.summaryValue}>{formatPrice(totalHT)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>TVA ({formData.tvaTaux}%)</Text>
          <Text style={styles.summaryValue}>{formatPrice(totalTTC - totalHT)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelMain}>Total TTC</Text>
          <Text style={styles.summaryValueMain}>{formatPrice(totalTTC)}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title={formData.editingDevisId ? "Enregistrer les modifications" : "Créer le devis"}
          onPress={handleCreate}
          loading={loading}
        />
        <Button
          title="Retour"
          onPress={() => router.back()}
          variant="outline"
          style={styles.backButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  infoDetail: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: 2,
  },
  clientHeader: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginVertical: Spacing.md,
  },
  posteHeader: {
    marginBottom: Spacing.sm,
  },
  posteCategorie: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  posteNom: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  posteQuantite: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  priceSection: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  priceLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sliderLabel: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.primary + '10',
    marginTop: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  summaryLabelMain: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryValueMain: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  actions: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  cardOffert: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: Colors.success,
    borderStyle: 'dashed',
  },
  offertBadge: {
    backgroundColor: Colors.success,
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  textOffert: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  offertCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  offertCheckboxLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});
