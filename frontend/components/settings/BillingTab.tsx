import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'https://mobile-backend-sync-1.preview.emergentagent.com';

interface BillingInfo {
  subscription_status: string;
  next_billing_date: string;
  payment_method: string;
}

export default function BillingTab() {
  const { token } = useAuth();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/users/billing`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBilling(response.data);
    } catch (error) {
      console.error('Failed to load billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert('Manage Subscription', 'This feature will open subscription management');
  };

  const handleUpdatePayment = () => {
    Alert.alert('Update Payment', 'This feature will open payment method update');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.activeStatus]}>
              {billing?.subscription_status || 'Active'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Next Billing Date</Text>
            <Text style={styles.value}>
              {billing?.next_billing_date || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.infoCard}>
          <Text style={styles.value}>
            {billing?.payment_method || 'No payment method on file'}
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleUpdatePayment}
          >
            <Text style={styles.linkText}>Update Payment Method</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleManageSubscription}
        >
          <Text style={styles.primaryButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#34C759',
  },
  linkButton: {
    marginTop: 8,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
