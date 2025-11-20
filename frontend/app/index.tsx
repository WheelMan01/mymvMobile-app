import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useDevAuth } from '../contexts/DevAuthContext'; // DEV ONLY

export default function Index() {
  const { user, isLoading } = useAuth();
  const { isAuthenticated: devIsAuthenticated, isDevMode } = useDevAuth(); // DEV ONLY
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 Index useEffect - isLoading:', isLoading, 'user:', !!user, 'devAuth:', devIsAuthenticated, 'devMode:', isDevMode);
    
    if (!isLoading) {
      // DEV ONLY: Check dev auth first
      if (isDevMode && devIsAuthenticated) {
        console.log('🔧 DEV: Redirecting to tabs (dev authenticated)');
        router.replace('/(tabs)');
      } else if (user) {
        console.log('✅ User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Not authenticated, redirecting to login');
        router.replace('/auth/login');
      }
    }
    
    // Fallback: Force redirect after 5 seconds if still loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⏱️ Timeout: Force redirecting to login after 5s');
        router.replace('/auth/login');
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [user, isLoading, devIsAuthenticated, isDevMode]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});