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
    Alert.alert('Coming Soon', 'Edit functionality will be available soon.');
  };

  const handleDelete = (membership: RoadsideMembership) => {
    Alert.alert(
      'Delete Roadside Assistance',
      'Are you sure you want to delete this roadside assistance membership? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/roadside-assistance/${membership.id}`);
              Alert.alert('Success', 'Roadside assistance deleted successfully');
              fetchMemberships();
            } catch (error) {
              console.error('Error deleting membership:', error);
              Alert.alert('Error', 'Failed to delete membership');
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
          <TouchableOpacity
            style={styles.emergencyCallButton}
            onPress={() => handleCallProvider(membership)}
          >
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.emergencyButtonText}>Call Provider (24/7)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.websiteButton} onPress={() => handleVisitWebsite(membership)}>
            <Ionicons name="globe" size={18} color="#000" />
            <Text style={styles.buttonText}>Visit Website</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.renewButton} onPress={() => handleRenewNow(membership)}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.renewButtonText}>Renew Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(membership)}>
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(membership)}>
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
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
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
  },
  addMembershipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
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
  membershipCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B3020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeSection: {
    marginBottom: 16,
  },
  membershipType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  membershipNumber: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dateSection: {
    marginBottom: 12,
    gap: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFFF',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});