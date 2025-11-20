// DEV ONLY - REMOVE IN PRODUCTION
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DevAuthContextType {
  isAuthenticated: boolean;
  devUser: any;
  devLogin: (email: string, password: string) => Promise<{ success: boolean }>;
  logout: () => void;
  isDevMode: boolean;
}

const DevAuthContext = createContext<DevAuthContextType | null>(null);

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [devUser, setDevUser] = useState(null);
  const [isDevMode] = useState(true); // Set to false in production

  useEffect(() => {
    // Check if user was previously logged in
    checkDevAuth();
  }, []);

  const checkDevAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('DEV_USER');
      if (savedUser) {
        setDevUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('No saved dev user');
    }
  };

  // FAKE login - accepts ANY credentials
  const devLogin = async (email: string, password: string) => {
    console.log('🔧 DEV MODE: Fake login - bypassing authentication');
    console.log('   Email:', email);
    console.log('   Password: [hidden]');

    // Create fake user object
    const fakeUser = {
      email: email,
      name: 'Dev User',
      membership_number: 'DEV123',
      id: 'dev-user-id',
      role: 'customer'
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem('DEV_USER', JSON.stringify(fakeUser));
    
    setDevUser(fakeUser);
    setIsAuthenticated(true);

    console.log('✅ DEV MODE: Login successful (no API call made)');

    return { success: true };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('DEV_USER');
    await AsyncStorage.removeItem('DEV_TOKEN');
    await AsyncStorage.removeItem('DEV_API_URL');
    setIsAuthenticated(false);
    setDevUser(null);
    console.log('🔧 DEV MODE: Logged out');
  };

  return (
    <DevAuthContext.Provider 
      value={{ 
        isAuthenticated, 
        devUser, 
        devLogin, 
        logout,
        isDevMode 
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

export const useDevAuth = () => {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useDevAuth must be used within DevAuthProvider');
  }
  return context;
};
