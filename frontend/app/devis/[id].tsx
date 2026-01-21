import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { devisService, Devis } from '../../services/devisService';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DevisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevis();
  }, [id]);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.get(id);
      setDevis(data);
    } catch (error) {
      console.error('Error loading devis:', error);
      Alert.alert('Erreur', 'Impossible de charger le devis');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const pdfUrl = devisService.getPdfUrl(id);
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le PDF');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le devis',
      'Êtes-vous sûr de vouloir supprimer ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await devisService.delete(id);
              Alert.alert('Succès', 'Devis supprimé', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le devis');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'valide':
        return Colors.success;
      case 'brouillon':
        return Colors.warning;
      case 'accepte':
        return Colors.primary;
      case 'refuse':
        return Colors.error;
      default:
        return Colors.textLight;
    }
  };

  if (loading || !devis) {
    return (
      <View style={styles.loading}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.numero}>{devis.numero_devis}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatutColor(devis.statut) },
          ]}
        >
          <Text style={styles.statusText}>{devis.statut}</Text>
        </View>
      </View>

      <Card>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client</Text>
          <Text style={styles.infoValue}>{devis.client_nom}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{formatDate(devis.date_creation)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>TVA</Text>
          <Text style={styles.infoValue}>{devis.tva_taux}%</Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Postes de travaux</Text>
      {devis.postes.map((poste, index) => (
        <Card key={poste.id}>
          <View style={styles.posteHeader}>
            <Text style={styles.posteCategorie}>{poste.categorie.toUpperCase()}</Text>
          </View>
          <Text style={styles.posteNom}>{poste.reference_nom}</Text>
          <View style={styles.posteDetails}>
            <Text style={styles.posteDetail}>
              Quantité: {poste.quantite} {poste.unite}
            </Text>
            <Text style={styles.posteDetail}>
              Prix unitaire: {formatPrice(poste.prix_ajuste)}
            </Text>
          </View>
          <View style={styles.posteSousTotal}>
            <Text style={styles.posteSousTotalLabel}>Sous-total</Text>
            <Text style={styles.posteSousTotalValue}>
              {formatPrice(poste.sous_total)}
            </Text>
          </View>
        </Card>
      ))}

      <Card style={styles.totalsCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total HT</Text>
          <Text style={styles.totalValue}>{formatPrice(devis.total_ht)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TVA ({devis.tva_taux}%)</Text>
          <Text style={styles.totalValue}>
            {formatPrice(devis.total_ttc - devis.total_ht)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabelMain}>Total TTC</Text>
          <Text style={styles.totalValueMain}>{formatPrice(devis.total_ttc)}</Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          title="Exporter en PDF"
          onPress={handleExportPDF}
          style={styles.actionButton}
        />
        <Button
          title="Supprimer"
          onPress={handleDelete}
          variant="outline"
          style={[styles.actionButton, { borderColor: Colors.error }]}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  numero: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.surface,
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
  },
  posteDetails: {
    marginBottom: Spacing.sm,
  },
  posteDetail: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  posteSousTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  posteSousTotalLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  posteSousTotalValue: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  totalsCard: {
    backgroundColor: Colors.primary + '10',
    marginTop: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabelMain: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalValueMain: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  actions: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
});
