import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// CRITICAL: THIS IS THE SHARED BRIDGE URL - DO NOT CHANGE!
// ============================================================================
const BRIDGE_URL = 'https://app-bridge-api.preview.emergentagent.com';
// ============================================================================

export default function DevSettingsScreen() {
  const [apiUrl, setApiUrl] = useState(BRIDGE_URL); // Always start with bridge URL
  const [token, setToken] = useState('');
  const [testEmail, setTestEmail] = useState('anthony@wheelsfinance.com.au');
  const [testPin, setTestPin] = useState('1234');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeDevSettings();
  }, []);

  const initializeDevSettings = async () => {
    try {
      // Clear any old wrong URLs from cache
      await AsyncStorage.removeItem('DEV_API_URL');
      
      // Set to bridge URL
      await AsyncStorage.setItem('DEV_API_URL', BRIDGE_URL);
      setApiUrl(BRIDGE_URL);
      
      // Load saved token if exists
      const savedToken = await AsyncStorage.getItem('DEV_TOKEN');
      if (savedToken) {
        setToken(savedToken);
      }
      
      console.log('✅ Dev Settings initialized with BRIDGE URL:', BRIDGE_URL);
    } catch (error) {
      console.log('Init error:', error);
    }
  };

  const useBridgeUrl = async () => {
    setApiUrl(BRIDGE_URL);
    await AsyncStorage.setItem('DEV_API_URL', BRIDGE_URL);
    Alert.alert('Success', '✅ Bridge URL set!');
  };

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('DEV_API_URL', apiUrl);
      await AsyncStorage.setItem('DEV_TOKEN', token);
      
      Alert.alert('Success', '✅ Configuration saved!');
      console.log('✅ Saved - URL:', apiUrl);
      console.log('✅ Saved - Token:', token.substring(0, 20) + '...');
    } catch (error) {
      Alert.alert('Error', 'Failed to save config');
    }
  };

  const getRealToken = async () => {
    if (!testEmail || !testPin) {
      Alert.alert('Error', 'Enter email and PIN');
      return;
    }

    setLoading(true);

    try {
      console.log('🔧 Getting token from:', BRIDGE_URL);
      
      const response = await fetch(`${BRIDGE_URL}/api/auth/pin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membership_number: testEmail,
          pin: testPin
        })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        await AsyncStorage.setItem('DEV_TOKEN', data.access_token);
        
        Alert.alert('Success', '✅ Got real auth token!');
        console.log('✅ Token received');
      } else {
        Alert.alert('Error', data.detail || 'Failed to get token');
        console.error('Failed:', data);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error: ' + error.message);
      console.error('Token error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);

    try {
      console.log('🔧 Testing connection to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/settings`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        Alert.alert('Success', '✅ Connected to backend!');
        console.log('✅ Connection test passed');
      } else {
        Alert.alert('Error', `Backend returned: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Connection failed: ' + error.message);
      console.error('Connection test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearConfig = async () => {
    await AsyncStorage.removeItem('DEV_API_URL');
    await AsyncStorage.removeItem('DEV_TOKEN');
    setApiUrl(BRIDGE_URL);
    setToken('');
    Alert.alert('Cleared', 'Configuration cleared');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Development Settings</Text>
      
      {/* BRIDGE URL REFERENCE - DO NOT REMOVE */}
      <View style={styles.bridgeBox}>
        <Text style={styles.bridgeTitle}>✅ CORRECT BRIDGE URL (Use This):</Text>
        <Text style={styles.bridgeUrl}>{BRIDGE_URL}</Text>
      </View>

      {/* Warning */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ This tab is for development only and will be removed in production
        </Text>
      </View>

      {/* Use Bridge URL Button */}
      <TouchableOpacity 
        onPress={useBridgeUrl} 
        style={[styles.button, styles.bridgeButton]}
      >
        <Text style={styles.buttonText}>✅ Use Correct Bridge URL</Text>
      </TouchableOpacity>

      {/* Backend URL Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Backend API URL:</Text>
        <TextInput
          value={apiUrl}
          onChangeText={setApiUrl}
          style={styles.input}
          placeholder="https://..."
          autoCapitalize="none"
          editable={false} // Make read-only to prevent accidental changes
        />
        <Text style={styles.hint}>
          This should always be: {BRIDGE_URL}
        </Text>
      </View>

      {/* Get Real Token */}
      <View style={styles.section}>
        <Text style={styles.label}>Get Real Auth Token:</Text>
        <TextInput
          value={testEmail}
          onChangeText={setTestEmail}
          style={styles.input}
          placeholder="Email/Membership Number"
          autoCapitalize="none"
        />
        <TextInput
          value={testPin}
          onChangeText={setTestPin}
          style={styles.input}
          placeholder="PIN"
          secureTextEntry
        />
        <TouchableOpacity 
          onPress={getRealToken} 
          style={[styles.button, styles.primaryButton]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Getting Token...' : 'Get Real Token from Backend'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual Token Entry */}
      <View style={styles.section}>
        <Text style={styles.label}>Auth Token:</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          style={[styles.input, styles.tokenInput]}
          placeholder="Token will appear here..."
          multiline
          autoCapitalize="none"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          onPress={saveConfig} 
          style={[styles.button, styles.successButton]}
        >
          <Text style={styles.buttonText}>💾 Save Configuration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testConnection} 
          style={[styles.button, styles.infoButton]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : '🔌 Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={clearConfig} 
          style={[styles.button, styles.dangerButton]}
        >
          <Text style={styles.buttonText}>🗑️ Clear Config</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📖 How to Use:</Text>
        <Text style={styles.infoText}>
          1. Confirm URL is: {BRIDGE_URL}{'\n'}
          2. Enter email/PIN and tap "Get Real Token"{'\n'}
          3. Tap "Save Configuration"{'\n'}
          4. Tap "Test Connection" to verify{'\n'}
          5. Return to app - uses real backend!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  bridgeBox: {
    backgroundColor: '#1e40af',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  bridgeTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bridgeUrl: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  warning: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  warningText: {
    color: '#92400e',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: 'white',
    fontSize: 14,
  },
  tokenInput: {
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  buttonGroup: {
    marginTop: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  bridgeButton: {
    backgroundColor: '#10b981',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  infoButton: {
    backgroundColor: '#8b5cf6',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
});
