import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { devisService, PosteCreate } from '../../services/devisService';
import { useDevisStore } from '../../store/devisStore';

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
    let totalHT = 0;
    postes.forEach(poste => {
      const prix = poste.prix_ajuste || poste.prix_default;
      totalHT += poste.quantite * prix;
    });
    const totalTTC = totalHT * (1 + formData.tvaTaux / 100);
    return { totalHT, totalTTC };
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
      const devis = await devisService.create({
        client_nom: formData.clientNom,
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

  if (!formData) {
    return null;
  }

  const { totalHT, totalTTC } = calculateTotal();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Récapitulatif du devis</Text>
        <Text style={styles.subtitle}>Ajustez les prix avec les curseurs</Text>
      </View>

      <Card>
        <Text style={styles.infoLabel}>Client: {formData.clientNom}</Text>
        <Text style={styles.infoLabel}>TVA: {formData.tvaTaux}%</Text>
      </Card>

      <Text style={styles.sectionTitle}>Postes de travaux</Text>

      {postes.map((poste, index) => {
        const currentPrice = poste.prix_ajuste || poste.prix_default;
        return (
          <Card key={index}>
            <View style={styles.posteHeader}>
              <Text style={styles.posteCategorie}>{poste.categorie.toUpperCase()}</Text>
            </View>
            <Text style={styles.posteNom}>{poste.reference_nom}</Text>
            <Text style={styles.posteQuantite}>
              {poste.quantite} {poste.unite}
            </Text>

            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>Prix unitaire ajustable</Text>
              <Text style={styles.priceValue}>{formatPrice(currentPrice)}</Text>
              
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
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primary}
                step={1}
              />
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(poste.quantite * currentPrice)}
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
          title="Créer le devis"
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
});
