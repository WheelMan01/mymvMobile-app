import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'https://app-bridge-api.preview.emergentagent.com';

interface NotificationPreferences {
  service_reminders: boolean;
  payment_due: boolean;
  membership_updates: boolean;
  promotional: boolean;
}

export default function NotificationsTab() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    service_reminders: true,
    payment_due: true,
    membership_updates: true,
    promotional: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/users/notification-preferences`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      await axios.patch(
        `${API_URL}/api/users/notification-preferences`,
        newPreferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPreferences(newPreferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification preferences');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Service Reminders</Text>
            <Text style={styles.preferenceDescription}>Get notified about upcoming vehicle service</Text>
          </View>
          <Switch
            value={preferences.service_reminders}
            onValueChange={(value) => updatePreference('service_reminders', value)}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Payment Due</Text>
            <Text style={styles.preferenceDescription}>Reminders for upcoming payments</Text>
          </View>
          <Switch
            value={preferences.payment_due}
            onValueChange={(value) => updatePreference('payment_due', value)}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Membership Updates</Text>
            <Text style={styles.preferenceDescription}>Important membership information</Text>
          </View>
          <Switch
            value={preferences.membership_updates}
            onValueChange={(value) => updatePreference('membership_updates', value)}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceLabel}>Promotional</Text>
            <Text style={styles.preferenceDescription}>Special offers and news</Text>
          </View>
          <Switch
            value={preferences.promotional}
            onValueChange={(value) => updatePreference('promotional', value)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
  },
});
