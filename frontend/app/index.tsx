import React from 'react';
import { Redirect } from 'expo-router';
// TEMPORARILY DISABLED TO DEBUG
// import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  // const { user, isLoading } = useAuth();
  
  // TEMPORARILY SKIP AUTH CHECK - go directly to login
  return <Redirect href="/auth/login" />;
  
  // Original auth-based redirect logic (commented out for debugging)
  // if (isLoading) {
  //   return (
  //     <View style={styles.container}>
  //       <ActivityIndicator size="large" color="#007AFF" />
  //     </View>
  //   );
  // }
  
  // if (user) {
  //   return <Redirect href="/(tabs)" />;
  // }
  
  // return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});