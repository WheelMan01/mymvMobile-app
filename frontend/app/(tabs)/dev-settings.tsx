// DEV ONLY - REMOVE IN PRODUCTION
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FIXED BRIDGE URL - This is the shared backend with populated data
const BRIDGE_URL = 'https://app-bridge-api.preview.emergentagent.com';
console.log('🔧 DEV SETTINGS - Using BRIDGE URL:', BRIDGE_URL);

export default function DevSettingsScreen() {
  // Default to the BRIDGE URL
  const [apiUrl, setApiUrl] = useState(BRIDGE_URL);
  const [token, setToken] = useState('');
  const [testEmail, setTestEmail] = useState('anthony@wheelsfinance.com.au');
  const [testPin, setTestPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = async () => {
    try {
      console.log('🧹 CLEARING ALL CACHED DATA FROM PREVIOUS FORK...');
      
      // AGGRESSIVE CLEAR: Remove ALL dev-related cached data
      await AsyncStorage.removeItem('DEV_API_URL');
      await AsyncStorage.removeItem('DEV_TOKEN');
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      console.log('✅ All cached data cleared');
      console.log('✅ Forcing BRIDGE URL:', BRIDGE_URL);
      
      // FORCE the bridge URL
      setApiUrl(BRIDGE_URL);
      setToken('');
      
      setStatusMessage(`✅ Ready! Using bridge URL: ${BRIDGE_URL}`);
      setStatusType('success');
    } catch (error) {
      console.log('Error clearing cache:', error);
    }
  };

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem('DEV_API_URL', apiUrl);
      await AsyncStorage.setItem('DEV_TOKEN', token);
      
      setStatusMessage('✅ Development config saved!');
      setStatusType('success');
    } catch (error) {
      setStatusMessage('❌ Failed to save config');
      setStatusType('error');
    }
  };

  const getRealToken = async () => {
    if (!testEmail || !testPin) {
      setStatusMessage('❌ Please enter email and PIN');
      setStatusType('error');
      return;
    }

    setLoading(true);
    setStatusMessage('🔄 Getting token from backend...');
    setStatusType('info');

    try {
      console.log('🔧 Getting real auth token from:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/auth/pin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          pin: testPin
        })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        await AsyncStorage.setItem('DEV_TOKEN', data.access_token);
        
        setStatusMessage('✅ Got real auth token from backend! Token saved automatically.');
        setStatusType('success');
        console.log('✅ Token received:', data.access_token.substring(0, 20) + '...');
      } else {
        const errorMsg = typeof data.detail === 'string' 
          ? data.detail 
          : data.message || JSON.stringify(data) || 'Unknown error';
        setStatusMessage(`❌ Failed to get token: ${errorMsg}`);
        setStatusType('error');
        console.error('Failed response:', response.status, data);
      }
    } catch (error: any) {
      setStatusMessage(`❌ Network error: ${error.message}`);
      setStatusType('error');
      console.error('Token fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setStatusMessage('🔄 Testing connection...');
    setStatusType('info');

    try:
      console.log('🔧 Testing connection to:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/settings`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        setStatusMessage('✅ Connected to backend successfully!');
        setStatusType('success');
        console.log('✅ Connection test passed');
      } else {
        setStatusMessage(`❌ Backend returned error: ${response.status}`);
        setStatusType('error');
      }
    } catch (error: any) {
      setStatusMessage(`❌ Connection failed: ${error.message}`);
      setStatusType('error');
      console.error('Connection test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCachedData = async () => {
    await AsyncStorage.removeItem('DEV_TOKEN');
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    setToken('');
    setStatusMessage('✅ All cached data cleared');
    setStatusType('success');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Development Settings</Text>
      <Text style={styles.warning}>
        ⚠️ This screen is for development only and will be removed in production
      </Text>

      {/* Blue Reference Box - Correct Bridge URL */}
      <View style={styles.blueReferenceBox}>
        <Text style={styles.blueReferenceLabel}>
          ✅ CORRECT BRIDGE URL (Use This):
        </Text>
        <Text style={styles.blueReferenceUrl}>
          {BRIDGE_URL}
        </Text>
      </View>

      {/* Use Bridge URL Button */}
      <TouchableOpacity
        onPress={() => setApiUrl(BRIDGE_URL)}
        style={[styles.button, styles.useBridgeButton]}
      >
        <Text style={styles.buttonText}>
          ✅ Use Correct Bridge URL
        </Text>
      </TouchableOpacity>

      {/* Status Message */}
      {statusMessage ? (
        <View style={[
          styles.statusBox,
          statusType === 'success' && styles.statusSuccess,
          statusType === 'error' && styles.statusError,
          statusType === 'info' && styles.statusInfo,
        ]}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}

      {/* Backend URL */}
      <View style={styles.section}>
        <Text style={styles.label}>Backend API URL:</Text>
        <TextInput
          value={apiUrl}
          onChangeText={setApiUrl}
          style={styles.input}
          placeholder="https://..."
          autoCapitalize="none"
        />
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
        <Text style={styles.label}>Or Paste Token Manually:</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          style={[styles.input, styles.tokenInput]}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
          <Text style={styles.buttonText}>Save Configuration</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={testConnection} 
          style={[styles.button, styles.infoButton]}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Testing...' : 'Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={clearCachedData} 
          style={[styles.button, styles.dangerButton]}
        >
          <Text style={styles.buttonText}>Clear Cached Data</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Getting Token Failed?</Text>
        <Text style={styles.infoText}>
          The mobile app database is separate from web after fork.{'\n\n'}
          <Text style={styles.bold}>SOLUTION: Get token from WEB APP:</Text>{'\n'}
          1. Open web app in browser{'\n'}
          2. Login with your credentials{'\n'}
          3. Open browser DevTools (F12){'\n'}
          4. Go to Console tab{'\n'}
          5. Type: localStorage.getItem('access_token'){'\n'}
          6. Copy the token (without quotes){'\n'}
          7. Paste it in "Manual Token Entry" below{'\n'}
          8. Tap "Save Configuration"{'\n\n'}
          Then go to Vehicles and you'll see real data!
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
    marginBottom: 10,
    marginTop: 40,
  },
  warning: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    color: '#92400e',
  },
  statusBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusSuccess: {
    backgroundColor: '#d1fae5',
  },
  statusError: {
    backgroundColor: '#fee2e2',
  },
  statusInfo: {
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  readOnlyUrlBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  readOnlyUrlText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#991b1b',
    fontFamily: 'monospace',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 5,
  },
  tokenInput: {
    height: 100,
    textAlignVertical: 'top',
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
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1e40af',
  },
});
