import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { factureService, Facture } from '../../services/factureService';
import Card from '../../components/Card';

export default function FactureDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacture();
  }, [id]);

  const loadFacture = async () => {
    try {
      const data = await factureService.get(id as string);
      setFacture(data);
    } catch (error) {
      console.error('Error loading facture:', error);
      Alert.alert('Erreur', 'Impossible de charger la facture');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const pdfUrl = factureService.getPdfUrl(id as string);
      await Linking.openURL(pdfUrl);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le PDF');
    }
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Marquer comme payée',
      'Confirmer que cette facture a été payée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await factureService.updateStatut(id as string, 'payee');
              loadFacture();
              Alert.alert('Succès', 'Facture marquée comme payée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la facture',
      'Êtes-vous sûr de vouloir supprimer cette facture ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await factureService.delete(id as string);
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la facture');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'payee':
        return Colors.success;
      case 'annulee':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'payee':
        return 'Payée';
      case 'annulee':
        return 'Annulée';
      default:
        return 'En attente';
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!facture) {
    return (
      <View style={styles.loading}>
        <Text>Facture non trouvée</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: facture.numero_facture,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.surface,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Header avec statut */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.factureNumber}>{facture.numero_facture}</Text>
              <Text style={styles.factureDate}>
                Créée le {formatDate(facture.date_creation)}
              </Text>
              {facture.date_paiement && (
                <Text style={styles.paidDate}>
                  Payée le {formatDate(facture.date_paiement)}
                </Text>
              )}
            </View>
            <View style={[styles.statutBadge, { backgroundColor: getStatutColor(facture.statut) }]}>
              <Text style={styles.statutText}>{getStatutLabel(facture.statut)}</Text>
            </View>
          </View>
        </Card>

        {/* Client */}
        <Card>
          <Text style={styles.sectionTitle}>Client</Text>
          <Text style={styles.clientName}>
            {facture.client.prenom} {facture.client.nom}
          </Text>
          {facture.client.adresse && (
            <Text style={styles.clientInfo}>{facture.client.adresse}</Text>
          )}
          {(facture.client.code_postal || facture.client.ville) && (
            <Text style={styles.clientInfo}>
              {facture.client.code_postal} {facture.client.ville}
            </Text>
          )}
          {facture.client.telephone && (
            <Text style={styles.clientInfo}>Tél: {facture.client.telephone}</Text>
          )}
          {facture.client.email && (
            <Text style={styles.clientInfo}>Email: {facture.client.email}</Text>
          )}
        </Card>

        {/* Totaux */}
        <Card style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatPrice(facture.total_ht)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({facture.tva_taux}%)</Text>
            <Text style={styles.totalValue}>{formatPrice(facture.total_tva)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelMain}>Total TTC</Text>
            <Text style={styles.totalValueMain}>{formatPrice(facture.total_ttc)}</Text>
          </View>
        </Card>

        {/* Postes */}
        <Text style={styles.sectionTitleOutside}>Détail des prestations</Text>
        {facture.postes.map((poste, index) => {
          const isOffert = poste.offert === true;
          return (
            <Card key={poste.id || index} style={isOffert ? styles.cardOffert : undefined}>
              <View style={styles.posteHeader}>
                <Text style={styles.posteCategorie}>{poste.categorie.toUpperCase()}</Text>
                {isOffert && <Text style={styles.offertBadge}>OFFERT</Text>}
              </View>
              <Text style={[styles.posteNom, isOffert && styles.textOffert]}>
                {poste.reference_nom}
              </Text>
              <View style={styles.posteDetails}>
                <Text style={styles.posteDetail}>
                  Quantité: {poste.quantite} {poste.unite}
                </Text>
                <Text style={[styles.posteDetail, isOffert && styles.textOffert]}>
                  Prix unitaire: {formatPrice(poste.prix_ajuste)}
                </Text>
              </View>
              <View style={styles.posteSousTotal}>
                <Text style={styles.posteSousTotalLabel}>Sous-total</Text>
                <Text style={[styles.posteSousTotalValue, isOffert && styles.textOffert]}>
                  {isOffert ? 'Offert' : formatPrice(poste.sous_total)}
                </Text>
              </View>
            </Card>
          );
        })}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleExportPdf}
          >
            <Ionicons name="download-outline" size={20} color={Colors.surface} />
            <Text style={styles.primaryButtonText}>Exporter PDF</Text>
          </TouchableOpacity>

          {facture.statut === 'en_attente' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={handleMarkAsPaid}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.surface} />
              <Text style={styles.primaryButtonText}>Marquer payée</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerButtonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
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
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  factureNumber: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  factureDate: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: 4,
  },
  paidDate: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginTop: 4,
  },
  statutBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statutText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: FontSize.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  sectionTitleOutside: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  clientName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  clientInfo: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  totalsCard: {
    marginTop: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  totalValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  totalLabelMain: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalValueMain: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  posteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  posteCategorie: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
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
  posteNom: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  posteDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  posteDetail: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
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
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardOffert: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: Colors.success,
    borderStyle: 'dashed',
  },
  textOffert: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  actions: {
    marginTop: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  successButton: {
    backgroundColor: Colors.success,
  },
  dangerButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  dangerButtonText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
