import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { factureService, Facture } from '../../services/factureService';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

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

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token récupéré:', token ? 'Oui' : 'Non');
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour télécharger le PDF');
        return;
      }
      
      const API_URL = 'https://reno-quote-pro.preview.emergentagent.com';
      const pdfUrl = `${API_URL}/api/factures/${id}/pdf`;
      console.log('URL PDF:', pdfUrl);
      
      // Create filename
      const filename = `Facture_${facture?.numero_facture || id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      console.log('Fichier destination:', fileUri);
      
      // Download with authentication
      console.log('Téléchargement en cours...');
      const downloadResult = await FileSystem.downloadAsync(
        pdfUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('Résultat téléchargement:', downloadResult.status);
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Partager la facture',
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Succès', `PDF téléchargé : ${filename}`);
        }
      } else {
        console.log('Erreur HTTP:', downloadResult.status);
        throw new Error(`Échec du téléchargement (${downloadResult.status})`);
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Erreur', 'Impossible d\'exporter le PDF. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
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
              Alert.alert('Succès', 'Facture supprimée', [
                { text: 'OK', onPress: () => router.back() },
              ]);
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

  if (loading && !facture) {
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
          title: 'Détail Facture',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.surface,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Header */}
        <Card>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.factureNumber}>{facture.numero_facture}</Text>
              <Text style={styles.factureDate}>
                Date: {formatDate(facture.date_creation)}
              </Text>
              <Text style={styles.devisRef}>
                Devis: {(facture as any).devis_numero || 'N/A'}
              </Text>
              {facture.date_paiement && (
                <Text style={styles.paidDate}>
                  Payée le: {formatDate(facture.date_paiement)}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatutColor(facture.statut) },
              ]}
            >
              <Text style={styles.statusText}>{getStatutLabel(facture.statut)}</Text>
            </View>
          </View>
        </Card>

        {/* Client Info */}
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

        {/* Informations */}
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TVA</Text>
            <Text style={styles.infoValue}>{facture.tva_taux}%</Text>
          </View>
        </Card>

        {/* Postes */}
        <Text style={styles.sectionTitle}>Postes de travaux</Text>
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

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Exporter en PDF"
            onPress={handleExportPDF}
            style={styles.actionButton}
          />
          {facture.statut === 'en_attente' && (
            <Button
              title="Marquer comme payée"
              onPress={handleMarkAsPaid}
              style={[styles.actionButton, { backgroundColor: Colors.success }]}
            />
          )}
          {facture.statut === 'payee' && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.paidText}>Facture payée</Text>
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
  devisRef: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: 2,
  },
  paidDate: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  sectionTitle: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
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
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
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
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '20',
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  paidText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
});
