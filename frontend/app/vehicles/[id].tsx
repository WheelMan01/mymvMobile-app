import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { format } from 'date-fns';

interface Vehicle {
  id: string;
  rego: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  body_type?: string;
  color?: string;
  odometer?: number;
  image?: string;
  purchase_date?: string;
  purchase_price?: number;
  created_at: string;
}

export default function VehicleDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vehicles/${id}`);
      console.log('Vehicle details response:', response.data);
      
      // Handle nested response structure
      const vehicleData = response.data?.data?.vehicle || response.data?.vehicle || response.data;
      setVehicle(vehicleData);
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      Alert.alert('Error', 'Failed to load vehicle details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Vehicle not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <TouchableOpacity onPress={() => router.push(`/vehicles/edit/${id}`)} style={styles.headerButton}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Image */}
        <View style={styles.imageContainer}>
          {vehicle.image ? (
            <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car" size={80} color="#8E8E93" />
              <Text style={styles.placeholderText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Vehicle Name */}
        <View style={styles.nameSection}>
          <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
          <Text style={styles.vehicleYear}>{vehicle.year}</Text>
        </View>

        {/* Basic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.labelText}>Registration</Text>
            </View>
            <Text style={styles.detailValue}>{vehicle.rego || 'N/A'}</Text>
          </View>

          {vehicle.vin && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="barcode" size={20} color="#007AFF" />
                <Text style={styles.labelText}>VIN</Text>
              </View>
              <Text style={styles.detailValue}>{vehicle.vin}</Text>
            </View>
          )}

          {vehicle.body_type && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="car-sport" size={20} color="#007AFF" />
                <Text style={styles.labelText}>Body Type</Text>
              </View>
              <Text style={styles.detailValue}>{vehicle.body_type}</Text>
            </View>
          )}

          {vehicle.color && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="color-palette" size={20} color="#007AFF" />
                <Text style={styles.labelText}>Color</Text>
              </View>
              <Text style={styles.detailValue}>{vehicle.color}</Text>
            </View>
          )}

          {vehicle.odometer && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="speedometer" size={20} color="#007AFF" />
                <Text style={styles.labelText}>Odometer</Text>
              </View>
              <Text style={styles.detailValue}>{vehicle.odometer.toLocaleString()} km</Text>
            </View>
          )}
        </View>

        {/* Purchase Information */}
        {(vehicle.purchase_date || vehicle.purchase_price) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Purchase Information</Text>
            
            {vehicle.purchase_date && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.labelText}>Purchase Date</Text>
                </View>
                <Text style={styles.detailValue}>
                  {format(new Date(vehicle.purchase_date), 'dd MMM yyyy')}
                </Text>
              </View>
            )}

            {vehicle.purchase_price && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons name="cash" size={20} color="#007AFF" />
                  <Text style={styles.labelText}>Purchase Price</Text>
                </View>
                <Text style={styles.detailValue}>${vehicle.purchase_price.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Services</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/insurance')}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Insurance</Text>
              <Text style={styles.actionSubtitle}>View insurance policies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/roadside')}>
            <View style={styles.actionIcon}>
              <Ionicons name="car" size={24} color="#FF9500" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Roadside Assistance</Text>
              <Text style={styles.actionSubtitle}>View roadside memberships</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/finance')}>
            <View style={styles.actionIcon}>
              <Ionicons name="cash" size={24} color="#007AFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Finance</Text>
              <Text style={styles.actionSubtitle}>View finance loans</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#fff',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  nameSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  vehicleName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 18,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
