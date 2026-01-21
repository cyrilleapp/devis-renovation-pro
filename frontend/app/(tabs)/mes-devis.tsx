import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { devisService, DevisListItem } from '../../services/devisService';
import { Card } from '../../components/Card';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MesDevisScreen() {
  const router = useRouter();
  const [devis, setDevis] = useState<DevisListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDevis = async () => {
    try {
      setLoading(true);
      const data = await devisService.list();
      setDevis(data);
    } catch (error) {
      console.error('Error loading devis:', error);
      Alert.alert('Erreur', 'Impossible de charger les devis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevis();
  }, []);

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

  const renderDevis = ({ item }: { item: DevisListItem }) => (
    <TouchableOpacity onPress={() => router.push(`/devis/${item.id}`)}>
      <Card>
        <View style={styles.devisRow}>
          <View style={styles.devisInfo}>
            <Text style={styles.devisNumero}>{item.numero_devis}</Text>
            <Text style={styles.devisClient}>{item.client_nom}</Text>
            <Text style={styles.devisDate}>{formatDate(item.date_creation)}</Text>
          </View>
          <View style={styles.devisRight}>
            <Text style={styles.devisPrice}>{formatPrice(item.total_ttc)}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatutColor(item.statut) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatutColor(item.statut) },
                ]}
              >
                {item.statut}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {devis.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun devis pour le moment</Text>
          <Text style={styles.emptySubtext}>
            Créez votre premier devis pour commencer
          </Text>
        </View>
      ) : (
        <FlatList
          data={devis}
          renderItem={renderDevis}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadDevis} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    textAlign: 'center',
  },
  devisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devisInfo: {
    flex: 1,
  },
  devisNumero: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  devisClient: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  devisDate: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
  devisRight: {
    alignItems: 'flex-end',
  },
  devisPrice: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  arrow: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
  },
});
