import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { API_URL } from '../services/api';

export default function RootLayout() {
  // Verify backend configuration on app startup
  useEffect(() => {
    console.log('=================================');
    console.log('Mobile App Configuration Check');
    console.log('=================================');
    console.log('Backend URL:', API_URL);
    console.log('Expected:', 'https://app-bridge-fix.preview.emergentagent.com');
    console.log('Match:', API_URL === 'https://app-bridge-fix.preview.emergentagent.com' ? '✅ CORRECT' : '❌ WRONG');
    console.log('=================================');
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/pin-login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}