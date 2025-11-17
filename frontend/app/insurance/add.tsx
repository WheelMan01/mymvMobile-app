import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';
import { format } from 'date-fns';

export default function AddInsurance() {
  const router = useRouter();
  const { vehicles } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [policyType, setPolicyType] = useState<'CTP' | 'Comprehensive' | 'Third Party'>('Comprehensive');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedProviderName, setSelectedProviderName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [premium, setPremium] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)); // Default: 1 year from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<Array<{id: string; name: string}>>([]);

  const [dateText, setDateText] = useState('');

  useEffect(() => {
    // Initialize date text with default date
    setDateText(format(expiryDate, 'dd/MM/yyyy'));
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await api.get('/insurance-providers');
      if (response.data.status === 'success') {
        setProviders(response.data.data.providers);
        // Set first provider as default if available
        if (response.data.data.providers.length > 0) {
          const firstProvider = response.data.data.providers[0];
          setSelectedProviderId(firstProvider.id);
          setSelectedProviderName(firstProvider.name);
        }
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load insurance providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  // Format date input as user types
  const handleDateInput = (text: string) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    let formatted = '';
    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
      if (numbers.length >= 3) {
        formatted += '/' + numbers.substring(2, 4);
      }
      if (numbers.length >= 5) {
        formatted += '/' + numbers.substring(4, 8);
      }
    }
    
    setDateText(formatted);
    
    // Parse complete date
    if (numbers.length === 8) {
      const day = parseInt(numbers.substring(0, 2));
      const month = parseInt(numbers.substring(2, 4)) - 1;
      const year = parseInt(numbers.substring(4, 8));
      const newDate = new Date(year, month, day);
      if (!isNaN(newDate.getTime())) {
        setExpiryDate(newDate);
      }
    }
  };

  // Format date in Australian format for display
  const formatAustralianDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  // Convert date to API format (YYYY-MM-DD)
  const formatApiDate = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (selectedDate) {
      setExpiryDate(selectedDate);
      setDateText(format(selectedDate, 'dd/MM/yyyy'));
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId || !selectedProviderName || !policyNumber || !premium) {
      Alert.alert('Error', 'Please fill in all required fields (Vehicle, Provider, Policy Number, Premium)');
      return;
    }

    setLoading(true);
    try {
      await api.post('/insurance-policies', {
        vehicle_id: selectedVehicleId,
        provider: selectedProviderName,
        policy_number: policyNumber,
        insurance_types: [policyType.toLowerCase()],
        premium: parseFloat(premium),
        expiry_date: formatApiDate(expiryDate),
        coverage_details: '',
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

        {/* Insurance Provider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance Provider *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedProviderName}
              onValueChange={(value) => {
                setSelectedProviderName(value);
                // Find the provider ID for the selected name
                const provider = providers.find(p => p.name === value);
                if (provider) {
                  setSelectedProviderId(provider.id);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select a provider..." value="" />
              {providers.map((provider) => (
                <Picker.Item key={provider.id} label={provider.name} value={provider.name} />
              ))}
            </Picker>
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
            <Text style={styles.label}>Expiry Date *</Text>
            <TextInput
              style={styles.input}
              value={dateText}
              onChangeText={handleDateInput}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.hint}>Type date as: 31/12/2025 (DD/MM/YYYY)</Text>
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
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  datePickerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});