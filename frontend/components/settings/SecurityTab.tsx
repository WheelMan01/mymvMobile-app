import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://photo-showroom.preview.emergentagent.com';

export default function SecurityTab() {
  const { token } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    try {
      await axios.post(
        `${API_URL}/api/auth/change-password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Password changed successfully');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change password');
    }
  };

  const handleChangePin = async () => {
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }
    
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    
    try {
      await axios.post(
        `${API_URL}/api/auth/change-pin`,
        { current_pin: currentPin, new_pin: newPin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'PIN changed successfully');
      setIsChangingPin(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to change PIN');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password</Text>
        {isChangingPassword ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Current Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm New Password"
              secureTextEntry
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleChangePassword}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsChangingPassword(true)}
          >
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* PIN Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PIN</Text>
        <Text style={styles.description}>Set a 4-digit PIN for quick login</Text>
        {isChangingPin ? (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Current PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="New PIN (4 digits)"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm New PIN"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleChangePin}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setIsChangingPin(false);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setIsChangingPin(true)}
          >
            <Text style={styles.actionButtonText}>Change PIN</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
