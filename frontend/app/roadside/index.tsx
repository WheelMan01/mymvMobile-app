import React, { useState, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function Roadside() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<RoadsideMembership[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const response = await api.get('/roadside-assistance');
      console.log('Roadside API response:', response.data);
      
      // Access nested data structure from live API
      // Note: API returns data.policies, not data.assistance
      const assistanceData = response.data?.data?.policies || [];
      console.log('Parsed roadside assistance:', assistanceData);
      
      setMemberships(assistanceData);
    } catch (error: any) {
      console.error('Error fetching roadside assistance:', error);
      Alert.alert('Error', 'Failed to load roadside memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleEmergencyCall = (phone: string) => {
    Alert.alert(
      'Call Roadside Assistance',
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  const MembershipCard = ({ membership }: { membership: RoadsideMembership }) => {
    // Check if policy is active based on expiry date
    const isActive = new Date(membership.expiry_date) > new Date();
    
    return (
      <View style={styles.membershipCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport" size={28} color="#FF3B30" />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#34C75920' : '#FF3B3020' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#34C759' : '#FF3B30' }]}>
              {isActive ? 'Active' : 'Expired'}
            </Text>
          </View>
        </View>

        <View style={styles.typeSection}>
          <Text style={styles.membershipType}>{membership.provider_name} {membership.plan_type}</Text>
          <Text style={styles.membershipNumber}>#{membership.membership_number}</Text>
        </View>

        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => handleEmergencyCall(membership.provider_phone)}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>Emergency Call: {membership.provider_phone}</Text>
        </TouchableOpacity>

        <View style={styles.dateSection}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.dateText}>Valid until: {format(new Date(membership.expiry_date), 'dd MMM yyyy')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#8E8E93" />
            <Text style={styles.dateText}>${membership.annual_premium}/year</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => router.push(`/roadside/${membership.id}`)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Roadside Assistance" />

      {memberships.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-sport-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No roadside memberships</Text>
          <Text style={styles.emptySubtext}>Add membership for emergency assistance</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/roadside/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Membership</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={memberships}
          renderItem={({ item }) => <MembershipCard membership={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchMemberships} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.addMembershipButton}
              onPress={() => router.push('/roadside/add')}
            >
              <Ionicons name="add-circle" size={24} color="#FF3B30" />
              <Text style={styles.addMembershipText}>Add New Membership</Text>
            </TouchableOpacity>
          }
        />
      )}
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
    color: '#1C1C1E',
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
    color: '#1C1C1E',
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
    color: '#007AFF',
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
    color: '#1C1C1E',
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