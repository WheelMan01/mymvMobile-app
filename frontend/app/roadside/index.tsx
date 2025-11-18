import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '../../components/AppHeader';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { format } from 'date-fns';

interface RoadsideMembership {
  id: string;
  vehicle_id: string;
  provider_id: string;
  provider_name: string;
  membership_number: string;
  annual_premium: number;
  expiry_date: string;
  plan_type: string;
  coverage_details?: string;
  provider_phone: string;
  provider_email?: string;
  provider_website?: string;
  provider_logo?: string;
}

interface Vehicle {
  id: string;
  rego_number: string;
  make: string;
  model: string;
  year: number;
}

export default function Roadside() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<RoadsideMembership[]>([]);
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const response = await api.get('/roadside-assistance');
      console.log('Roadside API response:', response.data);
      
      const assistanceData = response.data?.data?.policies || [];
      console.log('Parsed roadside assistance:', assistanceData);
      
      setMemberships(assistanceData);
      
      // Fetch vehicles for each membership
      const vehicleIds = [...new Set(assistanceData.map((m: RoadsideMembership) => m.vehicle_id))];
      const vehicleMap: { [key: string]: Vehicle } = {};
      
      await Promise.all(
        vehicleIds.map(async (vehicleId) => {
          try {
            const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
            const vehicleData = vehicleResponse.data?.data?.vehicle || vehicleResponse.data;
            vehicleMap[vehicleId] = vehicleData;
          } catch (error) {
            console.error(`Error fetching vehicle ${vehicleId}:`, error);
          }
        })
      );
      
      setVehicles(vehicleMap);
    } catch (error: any) {
      console.error('Error fetching roadside assistance:', error);
      Alert.alert('Error', 'Failed to load roadside memberships');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📱 Roadside screen focused - refreshing data');
      fetchMemberships();
    }, [])
  );

  useEffect(() => {
    fetchMemberships();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberships();
  };

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

  // Format plan type
  const formatPlanType = (planType: string): string => {
    return planType.charAt(0).toUpperCase() + planType.slice(1);
  };

  // Button Handlers
  const handleCallProvider = (membership: RoadsideMembership) => {
    if (!membership.provider_phone) {
      Alert.alert('No Phone Number', 'Provider phone number is not available.');
      return;
    }

    Alert.alert(
      '24/7 Emergency Roadside Assistance',
      `Call ${membership.provider_name} at ${membership.provider_phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            const formattedNumber = membership.provider_phone.replace(/\s+/g, '');
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

  const handleVisitWebsite = async (membership: RoadsideMembership) => {
    if (!membership.provider_website) {
      Alert.alert('No Website', 'Provider website is not available.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(membership.provider_website);
      if (canOpen) {
        await Linking.openURL(membership.provider_website);
      } else {
        Alert.alert('Error', 'Cannot open website');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleRenewNow = async (membership: RoadsideMembership) => {
    const website = membership.provider_website;

    if (!website) {
      Alert.alert(
        'No Renewal Link',
        'Renewal link is not available. Please contact your provider directly.',
        [
          {
            text: 'Call Provider',
            onPress: () => handleCallProvider(membership),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(website);
      if (canOpen) {
        await Linking.openURL(website);
      } else {
        Alert.alert('Error', 'Cannot open renewal link');
      }
    } catch (error) {
      console.error('Error opening renewal link:', error);
      Alert.alert('Error', 'Failed to open renewal link');
    }
  };

  const handleEdit = (membership: RoadsideMembership) => {
    // Navigate to edit screen with membership data
    router.push({
      pathname: '/roadside/edit',
      params: {
        id: membership.id,
        vehicle_id: membership.vehicle_id,
        provider_id: membership.provider_id,
        provider_name: membership.provider_name,
        membership_number: membership.membership_number,
        plan_type: membership.plan_type,
        annual_premium: membership.annual_premium.toString(),
        expiry_date: membership.expiry_date,
        coverage_details: membership.coverage_details || '',
        provider_phone: membership.provider_phone || '',
      },
    });
  };

  const handleDelete = (membership: RoadsideMembership) => {
    Alert.alert(
      'Delete Roadside Assistance',
      `Are you sure you want to delete this ${membership.provider_name} membership? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting membership:', membership.id);
              const response = await api.delete(`/roadside-assistance/${membership.id}`);
              console.log('✅ Delete response:', response);
              
              Alert.alert(
                'Success',
                'Roadside assistance deleted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh the list
                      fetchMemberships();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error deleting membership:', error);
              const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete membership';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const DetailedMembershipCard = ({ membership }: { membership: RoadsideMembership }) => {
    const vehicle = vehicles[membership.vehicle_id];
    const expiringStatus = getExpiringStatus(membership.expiry_date);

    if (!vehicle) {
      return (
        <View style={styles.card}>
          <ActivityIndicator size="small" color="#00BFFF" />
        </View>
      );
    }

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={28} color="#FF3B30" />
            <Text style={styles.headerTitle}>
              {vehicle.rego_number} - {vehicle.make} {vehicle.model}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {formatPlanType(membership.plan_type).toUpperCase()}
            </Text>
          </View>
          {expiringStatus.show && (
            <View style={[styles.expiringBadge, { backgroundColor: expiringStatus.color }]}>
              <Text style={styles.expiringBadgeText}>{expiringStatus.text}</Text>
            </View>
          )}
        </View>

        {/* Provider */}
        <Text style={styles.provider}>{membership.provider_name}</Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Membership Number</Text>
            <Text style={styles.value}>{membership.membership_number}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Expiry Date</Text>
            <Text style={styles.value}>{format(new Date(membership.expiry_date), 'dd/MM/yyyy')}</Text>
            <Text style={styles.daysRemaining}>{formatDaysRemaining(membership.expiry_date)}</Text>
          </View>

          <View style={styles.detailColumn}>
            <Text style={styles.label}>Plan Type</Text>
            <Text style={styles.value}>{formatPlanType(membership.plan_type)}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Annual Premium</Text>
            <Text style={styles.value}>${membership.annual_premium.toFixed(2)}</Text>
          </View>
        </View>

        {/* Coverage Details */}
        {membership.coverage_details && (
          <View style={styles.coverageSection}>
            <Text style={styles.label}>Coverage Details</Text>
            <Text style={styles.coverageText}>{membership.coverage_details}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Emergency Call - Full Width */}
          <TouchableOpacity
            style={styles.emergencyCallButton}
            onPress={() => handleCallProvider(membership)}
          >
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.emergencyButtonText}>Call Provider (24/7)</Text>
          </TouchableOpacity>

          {/* Secondary Actions - Two Column Grid */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleVisitWebsite(membership)}>
              <Ionicons name="globe-outline" size={20} color="#00BFFF" />
              <Text style={styles.secondaryButtonText}>Website</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleRenewNow(membership)}>
              <Ionicons name="refresh-outline" size={20} color="#00BFFF" />
              <Text style={styles.secondaryButtonText}>Renew</Text>
            </TouchableOpacity>
          </View>

          {/* Edit and Delete - Two Column Grid */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(membership)}>
              <Ionicons name="create-outline" size={20} color="#10B981" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(membership)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && memberships.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Roadside Assistance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Loading memberships...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Roadside Assistance" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Add Membership Button */}
        <TouchableOpacity
          style={styles.addMembershipButton}
          onPress={() => router.push('/roadside/add')}
        >
          <Ionicons name="add-circle" size={24} color="#FF3B30" />
          <Text style={styles.addMembershipText}>Add New Membership</Text>
        </TouchableOpacity>

        {memberships.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-sport-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>No roadside memberships</Text>
            <Text style={styles.emptySubtext}>Add membership for 24/7 emergency assistance</Text>
          </View>
        ) : (
          memberships.map((membership) => (
            <DetailedMembershipCard key={membership.id} membership={membership} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  addMembershipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addMembershipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
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
    marginBottom: 20,
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
  coverageSection: {
    marginBottom: 20,
  },
  coverageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  actions: {
    gap: 12,
  },
  emergencyCallButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  emergencyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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