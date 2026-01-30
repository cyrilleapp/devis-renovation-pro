import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { factureService, FactureListItem } from '../../services/factureService';
import { useAuthStore } from '../../store/authStore';

export default function MesFacturesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [factures, setFactures] = useState<FactureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFactures = async () => {
    try {
      const data = await factureService.list();
      setFactures(data);
    } catch (error) {
      console.error('Error loading factures:', error);
      Alert.alert('Erreur', 'Impossible de charger les factures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFactures();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFactures();
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

  const renderFactureItem = ({ item }: { item: FactureListItem }) => (
    <TouchableOpacity
      style={styles.factureCard}
      onPress={() => router.push(`/facture/${item.id}`)}
    >
      <View style={styles.factureHeader}>
        <View>
          <Text style={styles.factureNumber}>{item.numero_facture}</Text>
          <Text style={styles.factureClient}>{item.client_nom}</Text>
          <Text style={styles.devisRef}>Devis: {item.devis_numero}</Text>
        </View>
        <View style={styles.factureRight}>
          <Text style={styles.factureAmount}>{formatPrice(item.total_ttc)}</Text>
          <View style={[styles.statutBadge, { backgroundColor: getStatutColor(item.statut) }]}>
            <Text style={styles.statutText}>{getStatutLabel(item.statut)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.factureFooter}>
        <Text style={styles.factureDate}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
          {' '}{formatDate(item.date_creation)}
        </Text>
        {item.date_paiement && (
          <Text style={styles.facturePaiement}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            {' '}Payée le {formatDate(item.date_paiement)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed" size={64} color={Colors.textLight} />
        <Text style={styles.emptyText}>Connectez-vous pour voir vos factures</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={factures}
        renderItem={renderFactureItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune facture</Text>
            <Text style={styles.emptySubtext}>
              Créez des factures à partir de vos devis
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
  },
  factureCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  factureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  factureNumber: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  factureClient: {
    fontSize: FontSize.sm,
    color: Colors.text,
    marginTop: 2,
  },
  devisRef: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  factureRight: {
    alignItems: 'flex-end',
  },
  factureAmount: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statutBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  statutText: {
    color: Colors.surface,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  factureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  factureDate: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  facturePaiement: {
    fontSize: FontSize.xs,
    color: Colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    color: Colors.surface,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
