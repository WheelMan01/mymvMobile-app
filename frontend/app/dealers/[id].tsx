import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface DealerDetail {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  dealer_type: string;
  services_offered: string[];
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  is_approved: boolean;
}

export default function DealerDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [dealer, setDealer] = useState<DealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInventory, setShowInventory] = useState(false);

  const fetchDealer = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/dealers/${id}`);
      setDealer(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load dealer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealer();
  }, [id]);

  const handleCall = () => {
    if (dealer?.phone) {
      Linking.openURL(`tel:${dealer.phone}`);
    }
  };

  const handleEmail = () => {
    if (dealer?.email) {
      Linking.openURL(`mailto:${dealer.email}`);
    }
  };

  const handleWebsite = () => {
    if (dealer?.website) {
      Linking.openURL(dealer.website);
    }
  };

  const handleGetDirections = () => {
    if (dealer?.latitude && dealer?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${dealer.latitude},${dealer.longitude}`;
      Linking.openURL(url);
    } else if (dealer?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.address)}`;
      Linking.openURL(url);
    }
  };

  const handleBookService = () => {
    router.push('/service-booking/add');
  };

  if (loading || !dealer) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dealer Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Dealer Header */}
        <View style={styles.dealerHeader}>
          {dealer.logo ? (
            <Image source={{ uri: dealer.logo }} style={styles.dealerLogo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="business" size={48} color="#5856D6" />
            </View>
          )}
          <Text style={styles.dealerName}>{dealer.name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{dealer.dealer_type}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="call" size={24} color="#34C759" />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleEmail}>
            <View style={[styles.actionIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="mail" size={24} color="#007AFF" />
            </View>
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleGetDirections}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="navigate" size={24} color="#FF9500" />
            </View>
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
          {dealer.website && (
            <TouchableOpacity style={styles.actionCard} onPress={handleWebsite}>
              <View style={[styles.actionIcon, { backgroundColor: '#5856D620' }]}>
                <Ionicons name="globe" size={24} color="#5856D6" />
              </View>
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Information */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>{dealer.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>{dealer.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>{dealer.email}</Text>
          </View>
          {dealer.website && (
            <View style={styles.infoRow}>
              <Ionicons name="globe" size={20} color="#8E8E93" />
              <Text style={styles.infoText}>{dealer.website}</Text>
            </View>
          )}
        </View>

        {/* Operating Hours */}
        {dealer.operating_hours && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Operating Hours</Text>
            <Text style={styles.hoursText}>{dealer.operating_hours}</Text>
          </View>
        )}

        {/* Services Offered */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.servicesGrid}>
            {dealer.services_offered.map((service, index) => (
              <View key={index} style={styles.serviceChip}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vehicle Inventory - If Dealership */}
        {dealer.dealer_type.includes('Dealership') && (
          <View style={styles.infoCard}>
            <View style={styles.inventoryHeader}>
              <Text style={styles.sectionTitle}>Vehicle Inventory</Text>
              <TouchableOpacity onPress={() => setShowInventory(!showInventory)}>
                <Ionicons 
                  name={showInventory ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
            </View>
            {showInventory && (
              <View style={styles.inventoryContent}>
                <Text style={styles.inventoryText}>View available vehicles in the Marketplace</Text>
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={() => router.push('/marketplace')}
                >
                  <Text style={styles.browseButtonText}>Browse Inventory</Text>
                  <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Book Service */}
        <TouchableOpacity style={styles.bookServiceButton} onPress={handleBookService}>
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.bookServiceText}>Book Service Appointment</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  dealerHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dealerLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5856D620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dealerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeBadge: {
    backgroundColor: '#5856D620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5856D6',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
    lineHeight: 22,
  },
  hoursText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  serviceText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 6,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryContent: {
    marginTop: 16,
  },
  inventoryText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF20',
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  bookServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  bookServiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});