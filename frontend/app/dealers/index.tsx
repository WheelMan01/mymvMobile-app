import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Dealer {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  dealer_type: string;
  services_offered: string[];
  latitude?: number;
  longitude?: number;
}

export default function Dealers() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dealers');
      setDealers(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const DealerCard = ({ dealer }: { dealer: Dealer }) => (
    <TouchableOpacity 
      style={styles.dealerCard}
      onPress={() => router.push(`/dealers/${dealer.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={24} color="#5856D6" />
        </View>
        <View style={styles.headerRight}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{dealer.dealer_type}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.dealerName}>{dealer.name}</Text>
      
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color="#8E8E93" />
        <Text style={styles.infoText} numberOfLines={1}>{dealer.address}</Text>
      </View>

      <View style={styles.servicesContainer}>
        {dealer.services_offered.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceBadge}>
            <Text style={styles.serviceText}>{service}</Text>
          </View>
        ))}
        {dealer.services_offered.length > 3 && (
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceText}>+{dealer.services_offered.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => { e.stopPropagation(); handleCall(dealer.phone); }}
        >
          <Ionicons name="call" size={18} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => { e.stopPropagation(); handleEmail(dealer.email); }}
        >
          <Ionicons name="mail" size={18} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.actionButton}>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealer Showroom</Text>
        <View style={{ width: 40 }} />
      </View>

      {dealers.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No dealers available</Text>
          <Text style={styles.emptySubtext}>Check back later for dealerships</Text>
        </View>
      ) : (
        <FlatList
          data={dealers}
          renderItem={({ item }) => <DealerCard dealer={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDealers} />
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
  list: {
    padding: 16,
  },
  dealerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5856D620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    backgroundColor: '#5856D620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5856D6',
  },
  dealerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serviceBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 12,
    color: '#1C1C1E',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});