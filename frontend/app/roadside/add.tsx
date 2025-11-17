import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';
import { format } from 'date-fns';

export default function AddRoadside() {
  const router = useRouter();
  const { vehicles } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [providerId, setProviderId] = useState('default-provider');
  const [membershipType, setMembershipType] = useState<'Basic' | 'Premium'>('Basic');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [coverageDetails, setCoverageDetails] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVehicleId || !membershipNumber || !emergencyContact) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/roadside-assistance', {
        vehicle_id: selectedVehicleId,
        provider_id: 'default-provider-id',
        provider_name: 'NRMA Roadside Assistance',
        membership_number: membershipNumber,
        annual_premium: 149.00,
        expiry_date: endDate.toISOString().split('T')[0],
        plan_type: membershipType,
        coverage_details: coverageDetails || '',
        documents: []
      });

      // If we reach here, the request succeeded (no error thrown)
      setLoading(false);
      
      // Show success message and navigate back
      Alert.alert(
        'Success', 
        'Roadside assistance membership added successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('Error adding roadside assistance:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add roadside membership');
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
        <Text style={styles.headerTitle}>Add Roadside Assistance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Select Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Vehicle *</Text>
          {vehicles.length === 0 ? (
            <Text style={styles.emptyText}>No vehicles available. Add a vehicle first.</Text>
          ) : (
            vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicleId === vehicle.id && styles.vehicleCardSelected
                ]}
                onPress={() => setSelectedVehicleId(vehicle.id)}
              >
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                  <Text style={styles.vehicleYear}>{vehicle.year} • {vehicle.rego}</Text>
                </View>
                {selectedVehicleId === vehicle.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Membership Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Type *</Text>
          <View style={styles.membershipTypeButtons}>
            <TouchableOpacity
              style={[
                styles.membershipTypeButton,
                membershipType === 'Basic' && styles.membershipTypeButtonActive
              ]}
              onPress={() => setMembershipType('Basic')}
            >
              <Ionicons name="car-sport" size={20} color={membershipType === 'Basic' ? '#fff' : '#FF3B30'} />
              <View style={styles.membershipTypeContent}>
                <Text style={[
                  styles.membershipTypeText,
                  membershipType === 'Basic' && styles.membershipTypeTextActive
                ]}>Basic</Text>
                <Text style={[
                  styles.membershipTypeDescription,
                  membershipType === 'Basic' && styles.membershipTypeDescriptionActive
                ]}>Essential roadside support</Text>
              </View>
              {membershipType === 'Basic' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.membershipTypeButton,
                membershipType === 'Premium' && styles.membershipTypeButtonActive
              ]}
              onPress={() => setMembershipType('Premium')}
            >
              <Ionicons name="star" size={20} color={membershipType === 'Premium' ? '#fff' : '#FF3B30'} />
              <View style={styles.membershipTypeContent}>
                <Text style={[
                  styles.membershipTypeText,
                  membershipType === 'Premium' && styles.membershipTypeTextActive
                ]}>Premium</Text>
                <Text style={[
                  styles.membershipTypeDescription,
                  membershipType === 'Premium' && styles.membershipTypeDescriptionActive
                ]}>Comprehensive coverage</Text>
              </View>
              {membershipType === 'Premium' && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Membership Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Membership Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., RA-123456789"
              value={membershipNumber}
              onChangeText={setMembershipNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Emergency Contact Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1800 123 456"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Coverage Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter coverage details (optional)"
              value={coverageDetails}
              onChangeText={setCoverageDetails}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <View style={styles.dateDisplay}>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
              <Text style={styles.dateText}>{format(startDate, 'dd MMM yyyy')}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date (Expiry)</Text>
            <View style={styles.dateDisplay}>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
              <Text style={styles.dateText}>{format(endDate, 'dd MMM yyyy')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || vehicles.length === 0}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Membership...' : 'Add Roadside Membership'}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 20,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: '#FF3B30',
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
  membershipTypeButtons: {
    gap: 12,
  },
  membershipTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  membershipTypeButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  membershipTypeContent: {
    flex: 1,
    marginLeft: 12,
  },
  membershipTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  membershipTypeTextActive: {
    color: '#fff',
  },
  membershipTypeDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  membershipTypeDescriptionActive: {
    color: 'rgba(255,255,255,0.8)',
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
    height: 100,
    paddingTop: 12,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dateText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#FF3B30',
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