import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadToken();
  }, []);

  // Simplified - allow access to tabs even without auth for testing
  useEffect(() => {
    if (isLoading) return;
    
    // Don't force redirect, let users access the app
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="devis/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Détail du devis' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
