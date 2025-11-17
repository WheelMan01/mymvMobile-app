import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
// TEMPORARILY DISABLED TO DEBUG
// import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  // const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // TEMPORARILY SKIP AUTH CHECK TO DEBUG BLACK SCREEN
    router.replace('/auth/login');
    
    // if (!isLoading) {
    //   if (user) {
    //     router.replace('/(tabs)');
    //   } else {
    //     router.replace('/auth/login');
    //   }
    // }
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