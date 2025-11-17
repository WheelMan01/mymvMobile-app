import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
// TEMPORARILY DISABLED TO DEBUG
// import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  // const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for layout to mount before navigating
    const timer = setTimeout(() => {
      setIsReady(true);
      router.replace('/auth/login');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Loading...</Text>
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
  },
});