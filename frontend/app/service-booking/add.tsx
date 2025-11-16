import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface ServiceCenter {
  name: string;
  dealer_code: string;
  address: string;
  phone: string;
  main_contact: string;
  postcode: string;
  trading_as?: string;
  business_name?: string;
}

export default function AddServiceBooking() {
  const router = useRouter();
  
  // Form state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<ServiceCenter[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [postcodes, setPostcodes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    postcodeFilter: 'All Postcodes',
    provider: '',
    service_type: '',
    date: '',
    time: '',
    address: '',
    phone: '',
    contact: '',
    notes: '',
    dealer_code: '',
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper function to format date to Australian format (DD/MM/YYYY)
  const formatDateAU = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to convert date to API format (YYYY-MM-DD)
  const formatDateAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    
    if (date) {
      setSelectedDate(date);
      const apiDate = formatDateAPI(date);
      
      // Check if date is blocked
      if (blockedDates.includes(apiDate)) {
        Alert.alert('Date Unavailable', 'This date is not available. Please choose another date.');
        return;
      }
      
      setFormData({ ...formData, date: apiDate });
    }
  };

  const serviceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'General Inspection',
    'Major Service',
    'Minor Service',
    'Wheel Alignment',
    'Battery Check',
    'Air Conditioning Service',
    'Transmission Service',
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00',
  ];

  useEffect(() => {
    fetchVehicles();
    fetchServiceCenters();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      const vehiclesData = response.data?.data?.vehicles || [];
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Failed to load vehicles');
    }
  };

  const fetchServiceCenters = async () => {
    try {
      const response = await api.get('/public/dealers/service-centers');
      const centers = response.data?.service_centers || [];
      setServiceCenters(centers);
      setFilteredCenters(centers);
      
      // Extract unique postcodes
      const uniquePostcodes = ['All Postcodes', ...new Set(centers.map((c: ServiceCenter) => c.postcode).filter(Boolean))];
      setPostcodes(uniquePostcodes);
    } catch (error) {
      console.error('Error fetching service centers:', error);
      Alert.alert('Error', 'Failed to load service centers');
    }
  };

  const fetchBlockedDates = async (dealerCode: string) => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await api.get(`/public/dealer/${dealerCode}/available-dates?start_date=${startDate}&end_date=${endDate}`);
      const blocked = response.data?.data?.blocked_dates || [];
      setBlockedDates(blocked);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      // Don't show alert, just log the error
    }
  };

  const handleProviderSelect = (center: ServiceCenter) => {
    const providerName = center.trading_as || center.business_name || center.name;
    setFormData({
      ...formData,
      provider: providerName,
      address: center.address,
      phone: center.phone,
      contact: center.main_contact,
      dealer_code: center.dealer_code,
    });
    
    // Fetch blocked dates for this dealer
    fetchBlockedDates(center.dealer_code);
  };

  const handlePostcodeFilter = (postcode: string) => {
    setFormData({ ...formData, postcodeFilter: postcode });
    
    if (postcode === 'All Postcodes') {
      setFilteredCenters(serviceCenters);
    } else {
      setFilteredCenters(serviceCenters.filter(c => c.postcode === postcode));
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.vehicle_id) errors.push('Please select a vehicle');
    if (!formData.provider) errors.push('Please select a service provider');
    if (!formData.service_type) errors.push('Please select a service type');
    if (!formData.date) errors.push('Please select a date');
    if (!formData.time) errors.push('Please select a time');
    if (!formData.address) errors.push('Service location is required');
    
    // Check blocked date
    if (formData.date && blockedDates.includes(formData.date)) {
      errors.push('Selected date is not available. Please choose another date.');
    }
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const bookingData = {
        vehicle_id: formData.vehicle_id,
        provider: formData.provider,
        service_type: formData.service_type,
        date: formData.date,
        time: formData.time,
        address: formData.address,
        phone: formData.phone || '',
        contact: formData.contact || '',
        notes: formData.notes || '',
        status: 'pending',
        price: 0,
      };
      
      const response = await api.post('/services', bookingData);
      
      if (response.data?.status === 'success') {
        Alert.alert('Success', 'Service booking created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to create booking: ' + response.data?.message);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Vehicle Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Select Vehicle <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select a vehicle..." value="" />
                {vehicles.map((vehicle) => (
                  <Picker.Item
                    key={vehicle.id}
                    label={`${vehicle.make} ${vehicle.model} (${vehicle.year})`}
                    value={vehicle.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Postcode Filter */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Filter by Postcode</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.postcodeFilter}
                onValueChange={handlePostcodeFilter}
                style={styles.picker}
              >
                {postcodes.map((postcode) => (
                  <Picker.Item key={postcode} label={postcode} value={postcode} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Service Provider */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Service Provider <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.provider}
                onValueChange={(value) => {
                  const center = filteredCenters.find(c => 
                    (c.trading_as || c.business_name || c.name) === value
                  );
                  if (center) handleProviderSelect(center);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select a provider..." value="" />
                {filteredCenters.map((center, index) => (
                  <Picker.Item
                    key={index}
                    label={center.trading_as || center.business_name || center.name}
                    value={center.trading_as || center.business_name || center.name}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Service Type <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.service_type}
                onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select a service type..." value="" />
                {serviceTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Preferred Date <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(value) => setFormData({ ...formData, date: value })}
            />
            <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-12-15)</Text>
          </View>

          {/* Time */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Preferred Time <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select a time..." value="" />
                {timeSlots.map((time) => (
                  <Picker.Item key={time} label={time} value={time} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Address (Auto-filled) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Service Location <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={formData.address}
              editable={false}
              multiline
            />
            <Text style={styles.hint}>Auto-filled when provider is selected</Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={formData.phone}
              onChangeText={(value) => setFormData({ ...formData, phone: value })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Contact Person */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact name"
              value={formData.contact}
              onChangeText={(value) => setFormData({ ...formData, contact: value })}
            />
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any specific requirements or concerns..."
              value={formData.notes}
              onChangeText={(value) => setFormData({ ...formData, notes: value })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>Book Service</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
  form: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  readOnlyInput: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
