import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../services/api';
import CustomAlert from '../../components/CustomAlert';

// Static dropdown options
const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Wagon', 'Coupe', 'Convertible', 'Van', 'Ute', 'Truck'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'LPG'];
const PURCHASE_TYPES = ['Dealer', 'Private'];

export default function AddVehicleEnhanced() {
  const router = useRouter();
  
  // Basic Information
  const [regoNumber, setRegoNumber] = useState('');
  const [state, setState] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [color, setColor] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [odometer, setOdometer] = useState('');
  const [vehicleImage, setVehicleImage] = useState('');
  
  // Registration & Insurance
  const [registrationExpiry, setRegistrationExpiry] = useState<Date | undefined>();
  const [showRegoDatePicker, setShowRegoDatePicker] = useState(false);
  const [ctpProvider, setCtpProvider] = useState('');
  const [ctpPolicyNumber, setCtpPolicyNumber] = useState('');
  const [ctpExpiry, setCtpExpiry] = useState<Date | undefined>();
  const [showCtpDatePicker, setShowCtpDatePicker] = useState(false);
  const [warrantyProvider, setWarrantyProvider] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | undefined>();
  const [showWarrantyDatePicker, setShowWarrantyDatePicker] = useState(false);
  
  // Purchase Details
  const [purchaseType, setPurchaseType] = useState('Dealer');
  const [dealerId, setDealerId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  
  // Dynamic dropdown data
  const [ctpProviders, setCtpProviders] = useState<any[]>([]);
  const [warrantyProviders, setWarrantyProviders] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  
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

  // Load dropdown data on mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    setLoadingDropdowns(true);
    try {
      // Load CTP providers
      const ctpResponse = await api.get('/public/insurance-providers');
      const ctpData = ctpResponse.data?.data?.providers || [];
      setCtpProviders(ctpData.filter((p: any) => p.type === 'ctp'));
      
      // Load warranty providers
      const warrantyResponse = await api.get('/public/warranty-providers');
      const warrantyData = warrantyResponse.data?.data?.providers || [];
      setWarrantyProviders(warrantyData);
      
      // Load dealers
      const dealersResponse = await api.get('/public/dealers');
      const dealersData = dealersResponse.data?.data?.dealers || [];
      setDealers(dealersData);
      
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      // Don't show error to user - dropdowns will just be empty
    } finally {
      setLoadingDropdowns(false);
    }
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
          if (response.data.rego) setRegoNumber(response.data.rego);
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

  const formatDateForAPI = (date?: Date): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  const formatDateForDisplay = (date?: Date): string => {
    if (!date) return 'Select date';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`; // Returns dd/mm/yyyy
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!regoNumber || !state || !make || !model || !year || !bodyType) {
      showAlert('Error', 'Please fill in all required fields marked with (*)');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        rego_number: regoNumber,
        state: state,
        vin: vin || undefined,
        make: make,
        model: model,
        year: parseInt(year),
        body_type: bodyType,
        color: color || undefined,
        engine_number: engineNumber || undefined,
        transmission: transmission || undefined,
        fuel_type: fuelType || undefined,
        odometer: odometer ? parseInt(odometer) : undefined,
        registration_expiry: formatDateForAPI(registrationExpiry),
        vehicle_type: 'car',
        image: vehicleImage || undefined,
        
        // Purchase details (if provided)
        purchase_type: purchaseType,
        dealer_id: purchaseType === 'Dealer' ? dealerId || undefined : undefined,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        purchase_date: formatDateForAPI(purchaseDate),
      };

      console.log('Submitting vehicle data:', vehicleData);
      
      const response = await api.post('/vehicles', vehicleData);
      console.log('Vehicle created:', response.data);

      showAlert('Success', 'Vehicle added successfully!', () => router.back());
    } catch (error: any) {
      console.error('Error adding vehicle:', error);
      const errorMessage = error.response?.data?.detail 
        || error.message 
        || (typeof error === 'string' ? error : 'Failed to add vehicle');
      showAlert('Error', errorMessage);
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
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
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
                <Ionicons name="camera" size={40} color="#64748b" />
                <Text style={styles.imagePickerText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SECTION 1: Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC123"
              placeholderTextColor="#64748b"
              value={regoNumber}
              onChangeText={setRegoNumber}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select State', value: '' }}
                items={STATES.map(s => ({ label: s, value: s }))}
                onValueChange={setState}
                value={state}
                style={pickerSelectStyles}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>VIN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="17-digit VIN"
              placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
              value={make}
              onChangeText={setMake}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Camry"
              placeholderTextColor="#64748b"
              value={model}
              onChangeText={setModel}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2020"
              placeholderTextColor="#64748b"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Body Type *</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select Body Type', value: '' }}
                items={BODY_TYPES.map(bt => ({ label: bt, value: bt }))}
                onValueChange={setBodyType}
                value={bodyType}
                style={pickerSelectStyles}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., White, Black"
              placeholderTextColor="#64748b"
              value={color}
              onChangeText={setColor}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Engine Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Engine number"
              placeholderTextColor="#64748b"
              value={engineNumber}
              onChangeText={setEngineNumber}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transmission</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select Transmission', value: '' }}
                items={TRANSMISSIONS.map(t => ({ label: t, value: t }))}
                onValueChange={setTransmission}
                value={transmission}
                style={pickerSelectStyles}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select Fuel Type', value: '' }}
                items={FUEL_TYPES.map(ft => ({ label: ft, value: ft }))}
                onValueChange={setFuelType}
                value={fuelType}
                style={pickerSelectStyles}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Odometer (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50000"
              placeholderTextColor="#64748b"
              value={odometer}
              onChangeText={setOdometer}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* SECTION 2: Registration & Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration & Insurance</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Expiry</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowRegoDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDateForDisplay(registrationExpiry)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            {showRegoDatePicker && (
              <DateTimePicker
                value={registrationExpiry || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowRegoDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setRegistrationExpiry(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CTP Provider</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select CTP Provider', value: '' }}
                items={ctpProviders.map(p => ({ label: p.name, value: p.id }))}
                onValueChange={setCtpProvider}
                value={ctpProvider}
                style={pickerSelectStyles}
                disabled={loadingDropdowns}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CTP Policy Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Policy number"
              placeholderTextColor="#64748b"
              value={ctpPolicyNumber}
              onChangeText={setCtpPolicyNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CTP Expiry</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowCtpDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDateForDisplay(ctpExpiry)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            {showCtpDatePicker && (
              <DateTimePicker
                value={ctpExpiry || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowCtpDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setCtpExpiry(selectedDate);
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Warranty Provider</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                placeholder={{ label: 'Select Warranty Provider', value: '' }}
                items={warrantyProviders.map(p => ({ label: p.name, value: p.id }))}
                onValueChange={setWarrantyProvider}
                value={warrantyProvider}
                style={pickerSelectStyles}
                disabled={loadingDropdowns}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Warranty Expiry</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowWarrantyDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDateForDisplay(warrantyExpiry)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            {showWarrantyDatePicker && (
              <DateTimePicker
                value={warrantyExpiry || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowWarrantyDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setWarrantyExpiry(selectedDate);
                }}
              />
            )}
          </View>
        </View>

        {/* SECTION 3: Purchase Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Type</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  purchaseType === 'Dealer' && styles.toggleButtonActive
                ]}
                onPress={() => setPurchaseType('Dealer')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  purchaseType === 'Dealer' && styles.toggleButtonTextActive
                ]}>Dealer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  purchaseType === 'Private' && styles.toggleButtonActive
                ]}
                onPress={() => setPurchaseType('Private')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  purchaseType === 'Private' && styles.toggleButtonTextActive
                ]}>Private</Text>
              </TouchableOpacity>
            </View>
          </View>

          {purchaseType === 'Dealer' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dealer Name</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select Dealer', value: '' }}
                  items={dealers.map(d => ({ label: d.business_name, value: d.id }))}
                  onValueChange={setDealerId}
                  value={dealerId}
                  style={pickerSelectStyles}
                  disabled={loadingDropdowns}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Price</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 25000"
              placeholderTextColor="#64748b"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowPurchaseDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDateForDisplay(purchaseDate)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
            {showPurchaseDatePicker && (
              <DateTimePicker
                value={purchaseDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPurchaseDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setPurchaseDate(selectedDate);
                }}
              />
            )}
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
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
    color: '#94a3b8',
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
    backgroundColor: '#334155',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#0f3460',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
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
    color: '#94a3b8',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateButton: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94a3b8',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
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

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#fff',
    paddingRight: 30,
    fontWeight: '500',
  },
  inputAndroid: {
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    paddingRight: 30,
    fontWeight: '500',
  },
  inputWeb: {
    fontSize: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#fff',
    paddingRight: 30,
    fontWeight: '500',
  },
  placeholder: {
    color: '#94a3b8',
    fontSize: 18,
  },
  iconContainer: {
    top: 14,
    right: 14,
  },
});
