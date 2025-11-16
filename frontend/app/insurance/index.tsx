import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
}

export default function Insurance() {
  const router = useRouter();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/insurance-policies');
      console.log('Insurance API response:', response.data);
      
      // Access nested data structure from live API
      const policiesData = response.data?.data?.policies || [];
      console.log('Parsed insurance policies:', policiesData);
      
      setPolicies(policiesData);
    } catch (error: any) {
      console.error('Error fetching insurance policies:', error);
      Alert.alert('Error', 'Failed to load insurance policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const filteredPolicies = policies.filter(p => {
    const isActive = new Date(p.expiry_date) > new Date();
    if (filter === 'all') return true;
    if (filter === 'active') return isActive;
    if (filter === 'expired') return !isActive;
    return true;
  });

  const getPolicyColor = (types: string[]) => {
    const type = types[0]?.toLowerCase();
    switch (type) {
      case 'ctp': return '#34C759';
      case 'comprehensive': return '#007AFF';
      case 'third_party': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const PolicyCard = ({ policy }: { policy: InsurancePolicy }) => {
    const isActive = new Date(policy.expiry_date) > new Date();
    const policyType = policy.insurance_types[0]?.toUpperCase() || 'POLICY';
    
    return (
      <TouchableOpacity 
        style={[styles.policyCard, { borderLeftColor: getPolicyColor(policy.insurance_types) }]}
        onPress={() => router.push(`/insurance/${policy.id}`)}
      >
        <View style={styles.policyHeader}>
          <View style={[styles.typeBadge, { backgroundColor: getPolicyColor(policy.insurance_types) + '20' }]}>
            <Ionicons name="shield-checkmark" size={20} color={getPolicyColor(policy.insurance_types)} />
            <Text style={[styles.typeText, { color: getPolicyColor(policy.insurance_types) }]}>{policyType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#34C75920' : '#FF3B3020' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#34C759' : '#FF3B30' }]}>
              {isActive ? 'Active' : 'Expired'}
            </Text>
          </View>
        </View>
        <Text style={styles.policyNumber}>{policy.provider} - Policy #{policy.policy_number}</Text>
        <View style={styles.policyDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>${policy.premium}/year</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>Expires: {format(new Date(policy.expiry_date), 'dd MMM yyyy')}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'active' && styles.filterButtonActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'expired' && styles.filterButtonActive]}
          onPress={() => setFilter('expired')}
        >
          <Text style={[styles.filterText, filter === 'expired' && styles.filterTextActive]}>Expired</Text>
        </TouchableOpacity>
      </View>

      {filteredPolicies.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-checkmark-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No insurance policies</Text>
          <Text style={styles.emptySubtext}>Add your first policy to get started</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/insurance/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Policy</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPolicies}
          renderItem={({ item }) => <PolicyCard policy={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchPolicies} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.addPolicyButton}
              onPress={() => router.push('/insurance/add')}
            >
              <Ionicons name="add-circle" size={24} color="#34C759" />
              <Text style={styles.addPolicyText}>Add New Policy</Text>
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  addPolicyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addPolicyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 8,
  },
  policyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  policyNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  policyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
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
    backgroundColor: '#34C759',
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