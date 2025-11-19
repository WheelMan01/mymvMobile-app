import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';

export default function AddVehicle() {
  const router = useRouter();
  const { addVehicle } = useVehicles();
  
  // Form state
  const [rego, setRego] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [color, setColor] = useState('');
  const [vehicleImage, setVehicleImage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Custom alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>();
  
  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Camera permission is required to scan registration papers');
      return false;
    }
    return true;
  };

  const handleAIScan = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setScanning(true);
        try {
          const response = await api.post('/vehicles/extract-rego-data', {
            image_base64: result.assets[0].base64
          });

          // Populate form with extracted data
          if (response.data.rego) setRego(response.data.rego);
          if (response.data.vin) setVin(response.data.vin);
          if (response.data.make) setMake(response.data.make);
          if (response.data.model) setModel(response.data.model);
          if (response.data.year) setYear(response.data.year.toString());
          if (response.data.body_type) setBodyType(response.data.body_type);

          showAlert('Success', 'Vehicle data extracted successfully! Please review and confirm.');
        } catch (error: any) {
          console.error('AI Scan Error:', error);
          showAlert('Scan Error', error.response?.data?.detail || 'Failed to extract data. Please enter manually.');
        } finally {
          setScanning(false);
        }
      }
    } catch (error) {
      console.error('Camera Error:', error);
      showAlert('Error', 'Failed to open camera');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setVehicleImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!rego || !vin || !make || !model || !year) {
      showAlert('Error', 'Please fill in all required fields (marked with *)');
      return;
    }

    setLoading(true);
    try {
      await addVehicle({
        rego,
        vin,
        make,
        model,
        year: parseInt(year),
        body_type: bodyType || undefined,
        color: color || undefined,
        image: vehicleImage || undefined,
      });

      showAlert('Success', 'Vehicle added successfully!', () => router.back());
    } catch (error: any) {
      showAlert('Error', error.message);
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
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* AI Scan Button */}
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleAIScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.scanButtonText}>  Scanning...</Text>
            </>
          ) : (
            <>
              <Ionicons name="scan" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>  AI Rego Scan</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.scanHint}>Use AI to automatically extract vehicle details from registration paper</Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Vehicle Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Photo</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {vehicleImage ? (
              <Image source={{ uri: vehicleImage }} style={styles.vehicleImagePreview} />
            ) : (
              <>
                <Ionicons name="camera" size={40} color="#C7C7CC" />
                <Text style={styles.imagePickerText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC123"
              value={rego}
              onChangeText={setRego}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>VIN Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="17-digit VIN"
              value={vin}
              onChangeText={setVin}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Toyota"
              value={make}
              onChangeText={setMake}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Camry"
              value={model}
              onChangeText={setModel}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2020"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sedan, SUV, Hatchback"
              value={bodyType}
              onChangeText={setBodyType}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., White, Black"
              value={color}
              onChangeText={setColor}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertOnConfirm}
      />
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
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  vehicleImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePickerText: {
    marginTop: 8,
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
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
