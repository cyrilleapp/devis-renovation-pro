import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { devisService, Devis } from '../../services/devisService';
import { factureService } from '../../services/factureService';
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
      setLoading(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour télécharger le PDF');
        return;
      }
      
      const API_URL = 'https://quotemaster-35.preview.emergentagent.com';
      const pdfUrl = `${API_URL}/api/devis/${id}/pdf`;
      
      // Create filename
      const filename = `Devis_${devis?.numero_devis || id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Download with authentication
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Partager le devis',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Succès', `PDF téléchargé : ${filename}`);
        }
      } else {
        throw new Error('Échec du téléchargement');
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen with devis ID
    router.push(`/(tabs)/nouveau?devisId=${id}`);
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

  const handleGenerateFacture = () => {
    Alert.alert(
      'Générer une facture',
      'Voulez-vous créer une facture à partir de ce devis ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: async () => {
            try {
              setLoading(true);
              const facture = await factureService.create(id);
              Alert.alert(
                'Facture créée',
                `La facture ${facture.numero_facture} a été créée avec succès.`,
                [
                  { text: 'Voir la facture', onPress: () => router.push(`/facture/${facture.id}`) },
                  { text: 'OK' },
                ]
              );
              // Recharger le devis pour mettre à jour le statut
              loadDevis();
            } catch (error: any) {
              const message = error?.response?.data?.detail || 'Impossible de créer la facture';
              Alert.alert('Erreur', message);
            } finally {
              setLoading(false);
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
      case 'facture':
        return Colors.success;
      default:
        return Colors.textLight;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'valide':
        return 'Validé';
      case 'brouillon':
        return 'Brouillon';
      case 'accepte':
        return 'Accepté';
      case 'refuse':
        return 'Refusé';
      case 'facture':
        return 'Facturé';
      default:
        return statut;
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
          <Text style={styles.statusText}>{getStatutLabel(devis.statut)}</Text>
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
      {devis.postes.map((poste, index) => {
        const isOffert = poste.offert === true;
        return (
          <Card key={poste.id} style={isOffert ? styles.cardOffert : undefined}>
            <View style={styles.posteHeader}>
              <Text style={styles.posteCategorie}>{poste.categorie.toUpperCase()}</Text>
              {isOffert && <Text style={styles.offertBadge}>OFFERT</Text>}
            </View>
            <Text style={[styles.posteNom, isOffert && styles.textOffert]}>{poste.reference_nom}</Text>
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

      <Card style={styles.totalsCard}>
        {/* Les prix saisis sont en TTC - recalculer le HT à partir du TTC */}
        {(() => {
          const totalTTC = devis.postes
            .filter((p: any) => !p.offert)
            .reduce((sum: number, p: any) => sum + (p.sous_total || 0), 0);
          const tvaTaux = devis.tva_taux || 20;
          const totalHT = totalTTC / (1 + tvaTaux / 100);
          const totalTVA = totalTTC - totalHT;
          
          return (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total HT</Text>
                <Text style={styles.totalValue}>{formatPrice(totalHT)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA ({tvaTaux}%)</Text>
                <Text style={styles.totalValue}>{formatPrice(totalTVA)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelMain}>Total TTC</Text>
                <Text style={styles.totalValueMain}>{formatPrice(totalTTC)}</Text>
              </View>
            </>
          );
        })()}
      </Card>

      <View style={styles.actions}>
        <Button
          title="Modifier le devis"
          onPress={handleEdit}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Exporter en PDF"
          onPress={handleExportPDF}
          style={styles.actionButton}
        />
        {devis.statut !== 'facture' && (
          <Button
            title="Générer une facture"
            onPress={handleGenerateFacture}
            style={[styles.actionButton, { backgroundColor: Colors.success }]}
          />
        )}
        {devis.statut === 'facture' && (
          <View style={styles.facturedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.facturedText}>Facture générée</Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  facturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '20',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  facturedText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: FontSize.md,
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
  tvaNote: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
