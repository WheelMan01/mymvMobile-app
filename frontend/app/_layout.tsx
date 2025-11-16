import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { TamaguiProvider } from '@tamagui/core';
import config from '@tamagui/config/v3';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/pin-login" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </TamaguiProvider>
  );
}