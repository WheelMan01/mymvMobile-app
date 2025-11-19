import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://vehicle-photo-app.preview.emergentagent.com';

interface Transfer {
  id: string;
  vehicle_id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  vehicle?: {
    year: number;
    make: string;
    model: string;
  };
}

export default function TransfersTab() {
  const { token } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/transfers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransfers(response.data);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransfers();
  };

  const handleAcceptTransfer = async (transferId: string) => {
    try {
      await axios.post(
        `${API_URL}/api/transfers/${transferId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Transfer accepted');
      loadTransfers();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept transfer');
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await axios.post(
        `${API_URL}/api/transfers/${transferId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Transfer rejected');
      loadTransfers();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject transfer');
    }
  };

  const renderTransferItem = ({ item }: { item: Transfer }) => {
    const vehicleInfo = item.vehicle
      ? `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`
      : 'Vehicle';

    return (
      <View style={styles.transferCard}>
        <View style={styles.transferHeader}>
          <Text style={styles.vehicleName}>{vehicleInfo}</Text>
          <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.transferDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptTransfer(item.id)}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectTransfer(item.id)}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transfers}
        renderItem={renderTransferItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transfer requests</Text>
          </View>
        }
      />
    </View>
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
  transferCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status_pending: {
    backgroundColor: '#FF9500',
  },
  status_accepted: {
    backgroundColor: '#34C759',
  },
  status_rejected: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  transferDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
