import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '../../components/AppHeader';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
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

type TabType = 'ctp' | 'comprehensive' | 'third-party';

export default function Insurance() {
  const router = useRouter();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('ctp');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<InsurancePolicy | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/insurance-policies');
      console.log('Insurance API response:', response.data);
      
      const policiesData = response.data?.data?.policies || [];
      console.log('Parsed insurance policies:', policiesData);
      
      setPolicies(policiesData);
      
      // Fetch vehicles for each policy with timeout
      const vehicleIds = [...new Set(policiesData.map((p: InsurancePolicy) => p.vehicle_id))];
      const vehicleMap: { [key: string]: Vehicle } = {};
      
      const fetchWithTimeout = async (vehicleId: string) => {
        try {
          const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
          const vehicleData = vehicleResponse.data?.data?.vehicle || vehicleResponse.data;
          vehicleMap[vehicleId] = vehicleData;
        } catch (error) {
          console.error(`Error fetching vehicle ${vehicleId}:`, error);
          vehicleMap[vehicleId] = {
            id: vehicleId,
            rego_number: 'Unknown',
            make: 'Unknown',
            model: 'Vehicle',
            year: 0,
          };
        }
      };
      
      await Promise.allSettled(
        vehicleIds.map((vehicleId) => fetchWithTimeout(vehicleId))
      );
      
      console.log('✅ Vehicles fetched:', Object.keys(vehicleMap).length);
      setVehicles(vehicleMap);
    } catch (error: any) {
      console.error('Error fetching insurance policies:', error);
      Alert.alert('Error', 'Failed to load insurance policies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Insurance screen focused - refreshing data');
      fetchPolicies();
    }, [])
  );

  useEffect(() => {
    fetchPolicies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolicies();
  };

  // Filter policies by tab
  const filteredPolicies = policies.filter((policy) => {
    const policyType = policy.insurance_types[0]?.toLowerCase().replace('_', '-');
    return policyType === activeTab || 
           (activeTab === 'third-party' && (policyType === 'third_party' || policyType === 'third-party'));
  });

  // Calculate days remaining
  const calculateDaysRemaining = (expiryDate: string): number => {
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
    if (days < 0) return { color: '#DC2626', text: 'EXPIRED', show: true };
    if (days <= 30) return { color: '#EF4444', text: 'EXPIRING SOON', show: true };
    if (days <= 60) return { color: '#F59E0B', text: 'EXPIRING', show: true };
    return { show: false, color: '', text: '' };
  };

  // Format days remaining
  const formatDaysRemaining = (expiryDate: string): string => {
    const days = calculateDaysRemaining(expiryDate);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Button Handlers
  const handleCallProvider = (policy: InsurancePolicy) => {
    if (!policy.provider_phone) {
      Alert.alert('No Phone Number', 'Provider phone number is not available.');
      return;
    }

    Alert.alert(
      'Call Provider',
      `Call ${policy.provider} at ${policy.provider_phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            const formattedNumber = policy.provider_phone!.replace(/\s+/g, '');
            const telURL = `tel:${formattedNumber}`;
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
          },
        },
      ]
    );
  };

  const handleVisitWebsite = async (policy: InsurancePolicy) => {
    if (!policy.provider_website) {
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

  const handleRenewNow = async (policy: InsurancePolicy) => {
    const policyType = policy.insurance_types[0]?.toLowerCase();
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
      Alert.alert('No Renewal Link', 'Renewal link is not available. Please contact your provider directly.');
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

  const handleEdit = (policy: InsurancePolicy) => {
    Alert.alert('Coming Soon', 'Edit functionality will be available soon.');
  };

  const handleDelete = async (policy: InsurancePolicy) => {
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete this ${policy.provider} policy? This action cannot be undone.`
      );
      if (!confirmed) return;
      
      try {
        console.log('🗑️ Deleting policy:', policy.id);
        await api.delete(`/insurance-policies/${policy.id}`);
        console.log('✅ Policy deleted successfully');
        alert('Insurance policy deleted successfully');
        fetchPolicies();
      } catch (error: any) {
        console.error('❌ Error deleting policy:', error);
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete policy';
        alert('Error: ' + errorMessage);
      }
    } else {
      // Mobile Alert
      Alert.alert(
        'Delete Insurance Policy',
        `Are you sure you want to delete this ${policy.provider} policy? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ Deleting policy:', policy.id);
                const response = await api.delete(`/insurance-policies/${policy.id}`);
                console.log('✅ Delete response:', response);
                
                Alert.alert(
                  'Success',
                  'Insurance policy deleted successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        fetchPolicies();
                      },
                    },
                  ]
                );
              } catch (error: any) {
                console.error('❌ Error deleting policy:', error);
                const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete policy';
                Alert.alert('Error', errorMessage);
              }
            },
          },
        ]
      );
    }
  };

  const DetailedPolicyCard = ({ policy }: { policy: InsurancePolicy }) => {
    const vehicle = vehicles[policy.vehicle_id];
    const expiringStatus = getExpiringStatus(policy.expiry_date);

    const vehicleDisplay = vehicle 
      ? `${vehicle.rego_number} - ${vehicle.make} ${vehicle.model}`
      : 'Loading vehicle...';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={28} color="#00BFFF" />
            <Text style={styles.headerTitle}>
              {vehicleDisplay}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {policy.insurance_types[0]?.toUpperCase()}
            </Text>
          </View>
          {expiringStatus.show && (
            <View style={[styles.expiringBadge, { backgroundColor: expiringStatus.color }]}>
              <Text style={styles.expiringBadgeText}>{expiringStatus.text}</Text>
            </View>
          )}
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
            <Text style={styles.daysRemaining}>{formatDaysRemaining(policy.expiry_date)}</Text>
          </View>

          <View style={styles.detailColumn}>
            <Text style={styles.label}>Coverage</Text>
            <Text style={styles.value}>{policy.coverage_details || 'Standard'}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Annual Premium</Text>
            <Text style={styles.value}>{formatCurrency(policy.premium)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleCallProvider(policy)}>
              <Ionicons name="call-outline" size={20} color="#00BFFF" />
              <Text style={styles.secondaryButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleVisitWebsite(policy)}>
              <Ionicons name="globe-outline" size={20} color="#00BFFF" />
              <Text style={styles.secondaryButtonText}>Website</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.renewButton} onPress={() => handleRenewNow(policy)}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.renewButtonText}>Renew Now</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(policy)}>
              <Ionicons name="create-outline" size={20} color="#10B981" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(policy)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && policies.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Insurance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
          <Text style={styles.loadingText}>Loading policies...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Insurance" />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ctp' && styles.activeTab]}
          onPress={() => setActiveTab('ctp')}
        >
          <Text style={[styles.tabText, activeTab === 'ctp' && styles.activeTabText]}>
            CTP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'comprehensive' && styles.activeTab]}
          onPress={() => setActiveTab('comprehensive')}
        >
          <Text style={[styles.tabText, activeTab === 'comprehensive' && styles.activeTabText]}>
            Comprehensive
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'third-party' && styles.activeTab]}
          onPress={() => setActiveTab('third-party')}
        >
          <Text style={[styles.tabText, activeTab === 'third-party' && styles.activeTabText]}>
            Third Party
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Add Policy Button */}
        <TouchableOpacity
          style={styles.addPolicyButton}
          onPress={() => router.push({
            pathname: '/insurance/add',
            params: { preselectedType: activeTab }
          })}
        >
          <Ionicons name="add-circle" size={24} color="#00BFFF" />
          <Text style={styles.addPolicyText}>Add New {activeTab.replace('-', ' ').toUpperCase()} Policy</Text>
        </TouchableOpacity>

        {filteredPolicies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>No {activeTab.replace('-', ' ')} policies</Text>
            <Text style={styles.emptySubtext}>Add a policy to get started</Text>
          </View>
        ) : (
          filteredPolicies.map((policy) => (
            <DetailedPolicyCard key={policy.id} policy={policy} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00BFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#00BFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  addPolicyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addPolicyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFFF',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textTransform: 'capitalize',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginLeft: 12,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  expiringBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expiringBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  provider: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  daysRemaining: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  actions: {
    gap: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#00BFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#00BFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  renewButton: {
    backgroundColor: '#00BFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  renewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
});
