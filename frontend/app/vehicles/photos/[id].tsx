import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 3; // 3 images per row with padding

interface VehiclePhoto {
  id: string;
  image_url: string;
  caption?: string;
  admin_approved: boolean;
  upload_date: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  rego: string;
  show_in_showroom: boolean;
  showroom_admin_approved: boolean;
  photos: VehiclePhoto[];
}

export default function VehiclePhotos() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    loadVehiclePhotos();
  }, [id]);

  const loadVehiclePhotos = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/vehicles/${id}/photos`);
      setVehicle(response.data);
    } catch (error: any) {
      console.error('Error loading vehicle photos:', error);
      Alert.alert('Error', 'Failed to load vehicle photos');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
        setShowCaptionModal(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadPhoto = async () => {
    if (!selectedImageUri) return;

    try {
      setUploading(true);
      setShowCaptionModal(false);

      // Re-pick the image with base64
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) {
        setUploading(false);
        return;
      }

      const base64Image = result.assets[0].base64;

      const payload = {
        image_base64: base64Image,
        caption: caption || undefined,
      };

      await api.post(`/vehicles/${id}/photos`, payload);
      
      Alert.alert('Success', 'Photo uploaded successfully!');
      setCaption('');
      setSelectedImageUri(null);
      await loadVehiclePhotos();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vehicles/${id}/photos/${photoId}`);
              Alert.alert('Success', 'Photo deleted successfully');
              await loadVehiclePhotos();
            } catch (error: any) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const toggleShowroom = async () => {
    if (!vehicle) return;

    try {
      const response = await api.post(`/vehicles/${id}/toggle-showroom`);
      Alert.alert('Success', response.data.message);
      await loadVehiclePhotos();
    } catch (error: any) {
      console.error('Error toggling showroom:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to toggle showroom');
    }
  };

  const getShowroomStatus = () => {
    if (!vehicle) return { text: '', color: '', icon: 'help-circle' };

    if (vehicle.showroom_admin_approved) {
      return {
        text: '✅ Approved - Showing in Showroom',
        color: '#34C759',
        icon: 'checkmark-circle' as const,
      };
    } else if (vehicle.show_in_showroom) {
      return {
        text: '⏳ Pending Admin Review',
        color: '#FF9500',
        icon: 'time' as const,
      };
    } else {
      return {
        text: '❌ Not in Showroom',
        color: '#8E8E93',
        icon: 'close-circle' as const,
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
        <Text style={styles.loadingText}>Loading photos...</Text>
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

  const showroomStatus = getShowroomStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#00BFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vehicle Photos</Text>
          <Text style={styles.headerSubtitle}>
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Showroom Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="star" size={24} color="#00BFFF" />
            <Text style={styles.statusTitle}>Showroom Status</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: `${showroomStatus.color}20` }]}>
            <Ionicons name={showroomStatus.icon} size={20} color={showroomStatus.color} />
            <Text style={[styles.statusText, { color: showroomStatus.color }]}>
              {showroomStatus.text}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              vehicle.show_in_showroom && styles.toggleButtonActive,
            ]}
            onPress={toggleShowroom}
          >
            <Ionicons
              name={vehicle.show_in_showroom ? 'eye-off' : 'eye'}
              size={20}
              color="#fff"
            />
            <Text style={styles.toggleButtonText}>
              {vehicle.show_in_showroom ? 'Remove from Showroom' : 'Add to Showroom'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload New Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Photos Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Photos ({vehicle.photos.length})
          </Text>

          {vehicle.photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <Ionicons name="images-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Upload your first photo to get started
              </Text>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {vehicle.photos.map((photo) => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.image_url }} style={styles.photoImage} />
                  
                  {/* Approval Badge */}
                  <View
                    style={[
                      styles.approvalBadge,
                      { backgroundColor: photo.admin_approved ? '#34C759' : '#FF9500' },
                    ]}
                  >
                    <Ionicons
                      name={photo.admin_approved ? 'checkmark' : 'time'}
                      size={12}
                      color="#fff"
                    />
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => deletePhoto(photo.id)}
                  >
                    <Ionicons name="trash" size={16} color="#fff" />
                  </TouchableOpacity>

                  {/* Caption */}
                  {photo.caption && (
                    <View style={styles.captionContainer}>
                      <Text style={styles.captionText} numberOfLines={2}>
                        {photo.caption}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Caption Modal */}
      <Modal
        visible={showCaptionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCaptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Caption (Optional)</Text>
            
            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            )}

            <TextInput
              style={styles.captionInput}
              placeholder="Enter a caption for this photo..."
              placeholderTextColor="#8E8E93"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCaptionModal(false);
                  setSelectedImageUri(null);
                  setCaption('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={uploadPhoto}
              >
                <Text style={styles.modalButtonConfirmText}>Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  content: {
    flex: 1,
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
    backgroundColor: '#00BFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFFF',
    padding: 16,
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  photoContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  approvalBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  captionText: {
    color: '#fff',
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F2F2F7',
  },
  modalButtonCancelText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#00BFFF',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
