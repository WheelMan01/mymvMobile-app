import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';

export default function SellVehicle() {
  const router = useRouter();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<'New' | 'Used'>('Used');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVehicleId || !price || !description || !contactName || !contactPhone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/marketplace/listings', {
        vehicle_id: selectedVehicleId,
        price: parseFloat(price),
        negotiable: false,
        description,
        condition: condition.toLowerCase(),
        service_history: 'partial',
        features: [],
        display_in_showroom: false,
      });

      Alert.alert('Success', 'Your vehicle has been listed for sale!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sell Your Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            List your vehicle from your garage to reach potential buyers
          </Text>
        </View>

        {/* Select Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle *</Text>
          {vehiclesLoading ? (
            <Text style={styles.loadingText}>Loading your vehicles...</Text>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vehicles in your garage</Text>
              <TouchableOpacity 
                style={styles.addVehicleButton}
                onPress={() => router.push('/vehicles/add')}
              >
                <Text style={styles.addVehicleButtonText}>Add Vehicle First</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.vehicleList}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    selectedVehicleId === vehicle.id && styles.vehicleCardSelected
                  ]}
                  onPress={() => setSelectedVehicleId(vehicle.id)}
                >
                  <View style={styles.vehicleImageContainer}>
                    {vehicle.image ? (
                      <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                    ) : (
                      <View style={styles.vehiclePlaceholder}>
                        <Ionicons name="car" size={24} color="#C7C7CC" />
                      </View>
                    )}
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={styles.vehicleYear}>{vehicle.year}</Text>
                  </View>
                  {selectedVehicleId === vehicle.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Listing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Asking Price ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 25000"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Condition *</Text>
            <View style={styles.conditionButtons}>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  condition === 'New' && styles.conditionButtonActive
                ]}
                onPress={() => setCondition('New')}
              >
                <Text style={[
                  styles.conditionButtonText,
                  condition === 'New' && styles.conditionButtonTextActive
                ]}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  condition === 'Used' && styles.conditionButtonActive
                ]}
                onPress={() => setCondition('Used')}
              >
                <Text style={[
                  styles.conditionButtonText,
                  condition === 'Used' && styles.conditionButtonTextActive
                ]}>Used</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your vehicle, its condition, features, service history..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your phone number"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Your email (optional)"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || vehicles.length === 0}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating Listing...' : 'List Vehicle for Sale'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#007AFF20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  addVehicleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addVehicleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: '#34C759',
  },
  vehicleImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehiclePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#8E8E93',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  conditionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF20',
  },
  conditionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  conditionButtonTextActive: {
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});