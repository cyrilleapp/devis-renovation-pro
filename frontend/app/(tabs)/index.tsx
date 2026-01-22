import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { devisService, DevisListItem } from '../../services/devisService';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recentDevis, setRecentDevis] = useState<DevisListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentDevis = async () => {
    try {
      setLoading(true);
      // Only load if authenticated
      if (user) {
        const data = await devisService.list();
        setRecentDevis(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading devis:', error);
      // Don't show error for unauthenticated users
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecentDevis();
    }
  }, [user]);

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
      default:
        return Colors.textLight;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadRecentDevis} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour {user?.nom} 👋</Text>
        <Text style={styles.subtitle}>Bienvenue dans votre espace devis</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/nouveau')}
        >
          <Ionicons name="add-circle" size={40} color={Colors.primary} />
          <Text style={styles.actionText}>Nouveau{'\n'}Devis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/mes-devis')}
        >
          <Ionicons name="document-text" size={40} color={Colors.secondary} />
          <Text style={styles.actionText}>Mes{'\n'}Devis</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Devis récents</Text>
        {recentDevis.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Aucun devis pour le moment</Text>
            <Button
              title="Créer mon premier devis"
              onPress={() => router.push('/(tabs)/nouveau')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          recentDevis.map((devis) => (
            <TouchableOpacity
              key={devis.id}
              onPress={() => router.push(`/devis/${devis.id}`)}
            >
              <Card>
                <View style={styles.devisRow}>
                  <View style={styles.devisInfo}>
                    <Text style={styles.devisNumero}>{devis.numero_devis}</Text>
                    <Text style={styles.devisClient}>{devis.client_nom}</Text>
                    <Text style={styles.devisDate}>
                      {formatDate(devis.date_creation)}
                    </Text>
                  </View>
                  <View style={styles.devisRight}>
                    <Text style={styles.devisPrice}>
                      {formatPrice(devis.total_ttc)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatutColor(devis.statut) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatutColor(devis.statut) },
                        ]}
                      >
                        {devis.statut}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
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
    padding: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.surface,
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
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
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
  devisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});
