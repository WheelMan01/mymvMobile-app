import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://photo-showroom-app.preview.emergentagent.com';

export default function SecurityTab() {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChangePassword = async () => {
    // Client-side validation
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.post(
        `${API_URL}/api/user/change-password`,
        {
          current_password: passwords.currentPassword,
          new_password: passwords.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowSuccess(true);
      setIsExpanded(false);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to change password';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrorMessage('');
  };

  return (
    <ScrollView style={styles.container}>
      {showSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#166534" />
          <Text style={styles.successText}>Password changed successfully!</Text>
        </View>
      )}

      {errorMessage !== '' && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#991b1b" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage('')}>
            <Ionicons name="close" size={20} color="#991b1b" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Password & Authentication</Text>

        {!isExpanded ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsExpanded(true)}
          >
            <Ionicons name="key-outline" size={24} color="#00BFFF" />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ) : (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Change Password</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwords.currentPassword}
                onChangeText={(text) =>
                  setPasswords({ ...passwords, currentPassword: text })
                }
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwords.newPassword}
                onChangeText={(text) =>
                  setPasswords({ ...passwords, newPassword: text })
                }
                secureTextEntry
                placeholder="Enter new password (min 6 characters)"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwords.confirmPassword}
                onChangeText={(text) =>
                  setPasswords({ ...passwords, confirmPassword: text })
                }
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Security</Text>
        <TouchableOpacity style={[styles.actionButton, styles.buttonDisabled]} disabled>
          <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
          <Text style={[styles.actionButtonText, { color: '#666' }]}>
            Two-Factor Authentication (Coming Soon)
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  form: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelLink: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#00BFFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
