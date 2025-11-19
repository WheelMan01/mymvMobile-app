import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import api from '../../services/api';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

interface VehiclePhoto {
  id: string;
  image_url: string;
  caption?: string;
  admin_approved: boolean;
  upload_date: string;
}

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
  show_in_showroom?: boolean;
  showroom_admin_approved?: boolean;
  photos?: VehiclePhoto[];
}

export default function VehicleDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching vehicle details for ID:', id);
      
      // Try the photos endpoint first
      try {
        const response = await api.get(`/vehicles/${id}/photos`);
        console.log('Vehicle with photos response:', response.data);
        
        // Handle new response format: { status, message, data }
        if (response.data.status === 'success' && response.data.data) {
          setVehicle(response.data.data);
        } else {
          // Fallback for old format
          setVehicle(response.data);
        }
        return;
      } catch (photoError: any) {
        console.log('Photos endpoint not available, using vehicles list fallback');
        console.log('Error:', photoError.response?.status, photoError.message);
      }
      
      // Fallback: Get from vehicles list
      const vehiclesResponse = await api.get('/vehicles');
      console.log('Vehicles list response:', vehiclesResponse.data);
      
      // Parse the response structure
      const vehiclesList = vehiclesResponse.data?.data?.vehicles || 
                          vehiclesResponse.data?.vehicles || 
                          vehiclesResponse.data || [];
      
      const foundVehicle = vehiclesList.find((v: any) => v.id === id);
      
      if (foundVehicle) {
        // Add default photo properties
        setVehicle({
          ...foundVehicle,
          photos: foundVehicle.photos || foundVehicle.images?.map((url: string, idx: number) => ({
            id: idx.toString(),
            image_url: url,
            admin_approved: true,
            upload_date: new Date().toISOString(),
          })) || [],
          show_in_showroom: foundVehicle.show_in_showroom || false,
          showroom_admin_approved: foundVehicle.showroom_admin_approved || false,
        });
      } else {
        throw new Error('Vehicle not found in list');
      }
    } catch (error: any) {
      console.error('Error fetching vehicle details:', error);
      Alert.alert('Error', 'Failed to load vehicle details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      console.log('Starting image picker...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,
        base64: true,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      console.log('Image picker result:', result.canceled ? 'Canceled' : 'Selected');

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        if (!result.assets[0].base64) {
          Alert.alert('Error', 'Failed to convert image to base64');
          setUploading(false);
          return;
        }

        console.log('Uploading photo for vehicle:', id);
        console.log('Base64 length:', result.assets[0].base64.length);
        
        // Warn if image is still large
        if (result.assets[0].base64.length > 1000000) {
          console.warn('Large image detected:', result.assets[0].base64.length, 'bytes');
        }
        
        // Format: data:image/jpeg;base64,{base64_string}
        const imageWithPrefix = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        const payload = {
          image_base64: imageWithPrefix,
        };

        // Set a longer timeout for large uploads
        const response = await api.post(`/vehicles/${id}/photos`, payload, {
          timeout: 60000, // 60 seconds
        });
        console.log('Upload response:', response.data);
        
        // Handle new response format
        const message = response.data.message || 'Photo uploaded successfully!';
        Alert.alert('Success', message);
        await fetchVehicleDetails();
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Failed to upload photo';
      
      // Check for 404 - endpoint doesn't exist
      if (error.response?.status === 404) {
        errorMessage = 'Photo upload feature is not yet available. The backend API endpoint needs to be implemented.';
        Alert.alert(
          'Feature Not Available',
          'The photo upload feature requires backend API support that is currently being developed. Please check back later or contact support.',
          [{ text: 'OK' }]
        );
      } else {
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.message) {
          errorMessage = error.message;
        }
        Alert.alert('Upload Error', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const toggleShowroom = async () => {
    if (!vehicle) return;

    try {
      const response = await api.post(`/vehicles/${id}/toggle-showroom`, {});
      console.log('Toggle showroom response:', response.data);
      
      // Handle new response format
      const message = response.data.message || 'Showroom status updated';
      Alert.alert('Success', message);
      await fetchVehicleDetails();
    } catch (error: any) {
      console.error('Error toggling showroom:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to toggle showroom');
    }
  };

  const handlePhotoScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentPhotoIndex(index);
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
        {/* Photo Carousel or Placeholder */}
        <View style={styles.photoCarouselContainer}>
          {vehicle.photos && vehicle.photos.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handlePhotoScroll}
                scrollEventThrottle={16}
                style={styles.carousel}
              >
                {vehicle.photos.map((photo, index) => (
                  <Image
                    key={photo.id}
                    source={{ uri: photo.image_url }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              
              {/* Photo Counter */}
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>
                  {currentPhotoIndex + 1} / {vehicle.photos.length}
                </Text>
              </View>

              {/* Photo Indicators */}
              <View style={styles.photoIndicators}>
                {vehicle.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={80} color="#8E8E93" />
              <Text style={styles.placeholderText}>No photos yet</Text>
              <Text style={styles.placeholderSubtext}>Upload your first photo</Text>
            </View>
          )}

          {/* Upload Photo Button - Floating */}
          <TouchableOpacity
            style={styles.uploadPhotoButton}
            onPress={pickAndUploadImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="camera" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Showroom Toggle Card */}
        <View style={styles.showroomCard}>
          <View style={styles.showroomInfo}>
            <Ionicons name="star" size={24} color="#FFD60A" />
            <View style={styles.showroomTextContainer}>
              <Text style={styles.showroomTitle}>Showroom Status</Text>
              <Text style={styles.showroomStatus}>
                {vehicle.showroom_admin_approved
                  ? '✅ Approved & Live'
                  : vehicle.show_in_showroom
                  ? '⏳ Pending Approval'
                  : '❌ Not in Showroom'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.showroomButton,
              vehicle.show_in_showroom && styles.showroomButtonActive,
            ]}
            onPress={toggleShowroom}
          >
            <Text style={styles.showroomButtonText}>
              {vehicle.show_in_showroom ? 'Remove' : 'Add to Showroom'}
            </Text>
          </TouchableOpacity>
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
  photoCarouselContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    position: 'relative',
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  carouselImage: {
    width: width,
    height: 300,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  uploadPhotoButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  photoCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 24,
  },
  showroomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  showroomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  showroomTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  showroomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  showroomStatus: {
    fontSize: 13,
    color: '#8E8E93',
  },
  showroomButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  showroomButtonActive: {
    backgroundColor: '#FF3B30',
  },
  showroomButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
