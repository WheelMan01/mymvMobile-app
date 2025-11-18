import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import AppHeader from '../../components/AppHeader';
import { format } from 'date-fns';

interface InsurancePolicy {
  id: string;
  user_id: string;
  vehicle_id: string;
  provider: string;
  policy_number: string;
  insurance_types: string[];
  premium: number;
  expiry_date: string;
  coverage_details?: string;
  provider_phone?: string;
  provider_email?: string;
  provider_website?: string;
  provider_logo?: string;
  ctp_renewal_link?: string;
  comprehensive_renewal_link?: string;
  third_party_renewal_link?: string;
}

interface Vehicle {
  id: string;
  rego_number: string;
  make: string;
  model: string;
  year: number;
}

export default function InsuranceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicyDetails();
  }, [id]);

  const fetchPolicyDetails = async () => {
    try {
      setLoading(true);
      // Fetch all policies and find the one we need
      const response = await api.get('/insurance-policies');
      const policies = response.data?.data?.policies || [];
      const foundPolicy = policies.find((p: InsurancePolicy) => p.id === id);
      
      if (foundPolicy) {
        setPolicy(foundPolicy);
        // Fetch vehicle details
        const vehicleResponse = await api.get(`/vehicles/${foundPolicy.vehicle_id}`);
        setVehicle(vehicleResponse.data?.data?.vehicle);
      } else {
        Alert.alert('Error', 'Policy not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching policy details:', error);
      Alert.alert('Error', 'Failed to load policy details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining
  const calculateDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get expiring status
  const getExpiringStatus = (expiryDate: string) => {
    const days = calculateDaysRemaining(expiryDate);
    if (days < 0) return { color: '#DC2626', text: 'Expired', show: true };
    if (days <= 30) return { color: '#EF4444', text: 'Expiring Soon', show: true };
    if (days <= 60) return { color: '#F59E0B', text: 'Expiring', show: true };
    return { show: false, color: '', text: '' };
  };

  // Format days remaining text
  const formatDaysRemaining = (expiryDate: string) => {
    const days = calculateDaysRemaining(expiryDate);
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  // Button handlers
  const handleCallProvider = async () => {
    if (!policy?.provider_phone) {
      Alert.alert('No Phone Number', 'Provider phone number is not available.');
      return;
    }
    const telURL = `tel:${policy.provider_phone.replace(/\s+/g, '')}`;
    try {
      const canOpen = await Linking.canOpenURL(telURL);
      if (canOpen) {
        await Linking.openURL(telURL);
      } else {
        Alert.alert('Error', 'Cannot open phone dialer');
      }
    } catch (error) {
      console.error('Error opening dialer:', error);
      Alert.alert('Error', 'Failed to open phone dialer');
    }
  };

  const handleVisitWebsite = async () => {
    if (!policy?.provider_website) {
      Alert.alert('No Website', 'Provider website is not available.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(policy.provider_website);
      if (canOpen) {
        await Linking.openURL(policy.provider_website);
      } else {
        Alert.alert('Error', 'Cannot open website');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleRenewNow = async () => {
    if (!policy) return;
    
    const policyType = policy.insurance_types[0].toLowerCase();
    let renewalLink = null;
    
    if (policyType === 'ctp') {
      renewalLink = policy.ctp_renewal_link;
    } else if (policyType === 'comprehensive') {
      renewalLink = policy.comprehensive_renewal_link;
    } else if (policyType.includes('third')) {
      renewalLink = policy.third_party_renewal_link;
    }
    
    renewalLink = renewalLink || policy.provider_website;
    
    if (!renewalLink) {
      Alert.alert('No Renewal Link', 'Please contact provider directly.');
      return;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(renewalLink);
      if (canOpen) {
        await Linking.openURL(renewalLink);
      } else {
        Alert.alert('Error', 'Cannot open renewal link');
      }
    } catch (error) {
      console.error('Error opening renewal link:', error);
      Alert.alert('Error', 'Failed to open renewal link');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Insurance Policy',
      'Are you sure you want to delete this insurance policy? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete
        }
      ]
    );
  };

  const performDelete = async () => {
    try {
      await api.delete(`/insurance-policies/${id}`);
      Alert.alert(
        'Success',
        'Insurance policy deleted successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error deleting policy:', error);
      Alert.alert('Error', 'Failed to delete policy. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Insurance Details" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
        </View>
      </View>
    );
  }

  if (!policy || !vehicle) {
    return (
      <View style={styles.container}>
        <AppHeader title="Insurance Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Policy not found</Text>
        </View>
      </View>
    );
  }

  const status = getExpiringStatus(policy.expiry_date);

  return (
    <View style={styles.container}>
      <AppHeader title="Insurance Details" />
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
              <Text style={styles.headerTitle}>
                {vehicle.rego_number} - {vehicle.make} {vehicle.model}
              </Text>
            </View>
            <View style={styles.badges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {policy.insurance_types[0].toUpperCase()}
                </Text>
              </View>
              {status.show && (
                <View style={[styles.expiringBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.expiringBadgeText}>{status.text}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Provider */}
          <Text style={styles.provider}>{policy.provider}</Text>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailColumn}>
              <Text style={styles.label}>Policy Number</Text>
              <Text style={styles.value}>{policy.policy_number}</Text>

              <Text style={[styles.label, { marginTop: 20 }]}>Expiry Date</Text>
              <Text style={styles.value}>{format(new Date(policy.expiry_date), 'dd/MM/yyyy')}</Text>
              <Text style={styles.daysRemaining}>
                {formatDaysRemaining(policy.expiry_date)}
              </Text>
            </View>

            <View style={styles.detailColumn}>
              <Text style={styles.label}>Coverage</Text>
              <Text style={styles.value}>{policy.coverage_details || 'N/A'}</Text>

              <Text style={[styles.label, { marginTop: 20 }]}>Annual Premium</Text>
              <Text style={styles.value}>
                ${policy.premium.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.callButton} onPress={handleCallProvider}>
              <Ionicons name="call-outline" size={18} color="#000" />
              <Text style={styles.buttonText}>Call Provider</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.websiteButton} onPress={handleVisitWebsite}>
              <Ionicons name="globe-outline" size={18} color="#000" />
              <Text style={styles.buttonText}>Visit Website</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.renewButton} onPress={handleRenewNow}>
              <Text style={styles.renewButtonText}>Renew Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}>
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  expiringBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  expiringBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  provider: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 5,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  daysRemaining: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  callButton: {
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  websiteButton: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  renewButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
  renewButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
