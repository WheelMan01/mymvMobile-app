import React from 'react';
import { Stack } from 'expo-router';
// TEMPORARILY DISABLED TO DEBUG BLACK SCREEN
// import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/pin-login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}