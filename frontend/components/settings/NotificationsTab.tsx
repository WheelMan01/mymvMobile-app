import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://auto-specs-hub-1.preview.emergentagent.com';

interface Preferences {
  sms: boolean;
  email: boolean;
  push: boolean;
  alert_reminders: boolean;
  service_reminders: boolean;
  marketing_emails: boolean;
}

export default function NotificationsTab() {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [preferences, setPreferences] = useState<Preferences>({
    sms: true,
    email: true,
    push: true,
    alert_reminders: true,
    service_reminders: true,
    marketing_emails: false,
  });

  const [originalPreferences, setOriginalPreferences] = useState<Preferences>(preferences);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/user/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const prefs = response.data.preferences;
      setPreferences(prefs);
      setOriginalPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.put(
        `${API_URL}/api/user/notification-preferences`,
        preferences,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOriginalPreferences(preferences);
      setShowSuccess(true);
      setIsEditing(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update preferences';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPreferences(originalPreferences);
    setIsEditing(false);
    setErrorMessage('');
  };

  const togglePreference = (key: keyof Preferences) => {
    if (isEditing) {
      setPreferences({ ...preferences, [key]: !preferences[key] });
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {showSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#166534" />
          <Text style={styles.successText}>Notification preferences updated successfully!</Text>
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={20} color="#00BFFF" />
            <Text style={styles.editButtonText}>Edit Preferences</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Methods</Text>

        <View style={styles.preferenceItem}>
          <Ionicons name="mail-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>Email Notifications</Text>
          <Switch
            value={preferences.email}
            onValueChange={() => togglePreference('email')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.email ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.preferenceItem}>
          <Ionicons name="phone-portrait-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>SMS Notifications</Text>
          <Switch
            value={preferences.sms}
            onValueChange={() => togglePreference('sms')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.sms ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.preferenceItem}>
          <Ionicons name="notifications-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>Push Notifications</Text>
          <Switch
            value={preferences.push}
            onValueChange={() => togglePreference('push')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.push ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>

        <View style={styles.preferenceItem}>
          <Ionicons name="calendar-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>Renewal Reminders</Text>
          <Switch
            value={preferences.alert_reminders}
            onValueChange={() => togglePreference('alert_reminders')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.alert_reminders ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.preferenceItem}>
          <Ionicons name="construct-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>Service Reminders</Text>
          <Switch
            value={preferences.service_reminders}
            onValueChange={() => togglePreference('service_reminders')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.service_reminders ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>

        <View style={styles.preferenceItem}>
          <Ionicons name="megaphone-outline" size={24} color="#00BFFF" />
          <Text style={styles.preferenceLabel}>Marketing Emails</Text>
          <Switch
            value={preferences.marketing_emails}
            onValueChange={() => togglePreference('marketing_emails')}
            trackColor={{ false: '#333', true: '#00BFFF' }}
            thumbColor={preferences.marketing_emails ? '#fff' : '#999'}
            disabled={!isEditing}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#00BFFF',
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  preferenceLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
