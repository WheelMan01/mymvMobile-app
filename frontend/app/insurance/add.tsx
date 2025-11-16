import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';
import { format } from 'date-fns';

export default function AddInsurance() {
  const router = useRouter();
  const { vehicles } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [policyType, setPolicyType] = useState<'CTP' | 'Comprehensive' | 'Third Party'>('Comprehensive');
  const [providerId, setProviderId] = useState('default-provider');
  const [policyNumber, setPolicyNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedVehicleId || !policyNumber || !premium) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/insurance-policies', {
        vehicle_id: selectedVehicleId,
        policy_type: policyType,
        provider_id: providerId,
        policy_number: policyNumber,
        premium: parseFloat(premium),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        documents: []
      });

      Alert.alert('Success', 'Insurance policy added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add insurance policy');
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
        <Text style={styles.headerTitle}>Add Insurance Policy</Text>
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
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Policy Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Type *</Text>
          <View style={styles.policyTypeButtons}>
            <TouchableOpacity
              style={[
                styles.policyTypeButton,
                policyType === 'CTP' && styles.policyTypeButtonActive
              ]}
              onPress={() => setPolicyType('CTP')}
            >
              <Ionicons name="shield" size={20} color={policyType === 'CTP' ? '#fff' : '#34C759'} />
              <Text style={[
                styles.policyTypeText,
                policyType === 'CTP' && styles.policyTypeTextActive
              ]}>CTP (Green Slip)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.policyTypeButton,
                policyType === 'Comprehensive' && styles.policyTypeButtonActive
              ]}
              onPress={() => setPolicyType('Comprehensive')}
            >
              <Ionicons name="shield-checkmark" size={20} color={policyType === 'Comprehensive' ? '#fff' : '#007AFF'} />
              <Text style={[
                styles.policyTypeText,
                policyType === 'Comprehensive' && styles.policyTypeTextActive
              ]}>Comprehensive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.policyTypeButton,
                policyType === 'Third Party' && styles.policyTypeButtonActive
              ]}
              onPress={() => setPolicyType('Third Party')}
            >
              <Ionicons name="shield-half" size={20} color={policyType === 'Third Party' ? '#fff' : '#FF9500'} />
              <Text style={[
                styles.policyTypeText,
                policyType === 'Third Party' && styles.policyTypeTextActive
              ]}>Third Party</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Policy Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Policy Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., POL-123456789"
              value={policyNumber}
              onChangeText={setPolicyNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Annual Premium ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 1200"
              value={premium}
              onChangeText={setPremium}
              keyboardType="numeric"
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
            {loading ? 'Adding Policy...' : 'Add Insurance Policy'}
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
    borderColor: '#34C759',
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
  policyTypeButtons: {
    gap: 12,
  },
  policyTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  policyTypeButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  policyTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  policyTypeTextActive: {
    color: '#fff',
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