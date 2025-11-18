import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../hooks/useVehicles';
import api from '../../services/api';
import { format } from 'date-fns';

export default function EditFinance() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicles } = useVehicles();
  
  // Lenders state
  const [lenders, setLenders] = useState([]);
  const [loadingLenders, setLoadingLenders] = useState(true);
  const [selectedLenderName, setSelectedLenderName] = useState('');
  
  // Form state - Initialize with params
  const [selectedVehicleId, setSelectedVehicleId] = useState(params.vehicle_id as string || '');
  const [loanType, setLoanType] = useState(params.loan_type as string || 'chattel-mortgage');
  const [loanAmount, setLoanAmount] = useState(params.loan_amount as string || '');
  const [interestRate, setInterestRate] = useState(params.interest_rate as string || '');
  const [termMonths, setTermMonths] = useState(params.loan_term_months as string || '');
  const [monthlyPayment, setMonthlyPayment] = useState(params.monthly_payment as string || '');
  
  // Initialize start date from params
  const initStartDate = params.start_date ? new Date(params.start_date as string) : new Date();
  const [startDate, setStartDate] = useState(initStartDate);
  const [startDateText, setStartDateText] = useState(format(initStartDate, 'dd/MM/yyyy'));
  
  const [accountNumber, setAccountNumber] = useState(params.account_number as string || '');
  const [notes, setNotes] = useState(params.notes as string || '');
  const [loading, setLoading] = useState(false);

  // Fetch finance lenders on mount
  useEffect(() => {
    fetchFinanceLenders();
    // Set the lender after params are loaded
    if (params.lender) {
      setSelectedLenderName(params.lender as string);
    }
  }, []);

  // Auto-calculate monthly payment
  useEffect(() => {
    if (loanAmount && interestRate && termMonths) {
      const calculated = calculateMonthlyPayment(
        parseFloat(loanAmount),
        parseFloat(interestRate),
        parseInt(termMonths)
      );
      setMonthlyPayment(calculated.toString());
    }
  }, [loanAmount, interestRate, termMonths]);

  const fetchFinanceLenders = async () => {
    try {
      console.log('🔵 Fetching finance lenders from /api/finance-lenders...');
      const response = await api.get('/finance-lenders');
      console.log('✅ Finance lenders response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      if (response.data && response.data.status === 'success') {
        console.log('✅ Lenders found:', response.data.data.lenders.length);
        setLenders(response.data.data.lenders);
      } else {
        console.log('❌ Unexpected response format:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching finance lenders:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
    } finally {
      setLoadingLenders(false);
    }
  };

  const calculateMonthlyPayment = (amount, rate, months) => {
    const monthlyRate = (rate / 100) / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
    return parseFloat(payment.toFixed(2));
  };

  const formatStartDateInput = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    }
    
    setStartDateText(formatted);
    
    if (cleaned.length === 8) {
      try {
        const day = parseInt(cleaned.slice(0, 2));
        const month = parseInt(cleaned.slice(2, 4)) - 1;
        const year = parseInt(cleaned.slice(4, 8));
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          setStartDate(date);
        }
      } catch (e) {
        console.log('Invalid date');
      }
    }
  };

  const calculateEndDate = () => {
    if (termMonths) {
      const months = parseInt(termMonths);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + months);
      return endDate;
    }
    return new Date();
  };

  const handleSubmit = async () => {
    console.log('🔵 FINANCE UPDATE CLICKED');
    console.log('Form values:', {
      id: params.id,
      selectedVehicleId,
      selectedLenderName,
      loanAmount,
      interestRate,
      termMonths,
      monthlyPayment,
      startDate: startDate.toISOString().split('T')[0]
    });
    
    if (!selectedVehicleId || !selectedLenderName || !loanAmount || !interestRate || !termMonths || !monthlyPayment) {
      console.log('❌ Validation failed');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    console.log('✅ Validation passed, updating finance...');
    setLoading(true);
    try {
      const response = await api.put(`/finance-products/${params.id}`, {
        vehicle_id: selectedVehicleId,
        lender: selectedLenderName,
        loan_type: loanType,
        loan_amount: parseFloat(loanAmount),
        interest_rate: parseFloat(interestRate),
        loan_term_months: parseInt(termMonths),
        monthly_payment: parseFloat(monthlyPayment),
        start_date: startDate.toISOString().split('T')[0],
        end_date: calculateEndDate().toISOString().split('T')[0],
        account_number: accountNumber || '',
        notes: notes || '',
        documents: []
      });

      console.log('✅ Finance update successful, response:', response.status);
      setLoading(false);
      Alert.alert(
        'Success',
        'Finance loan updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🔙 Navigating back...');
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Error updating finance:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update finance product';
      Alert.alert('Error', errorMessage);
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
        <Text style={styles.headerTitle}>Edit Finance Product</Text>
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
                  <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Finance Lender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finance Lender *</Text>
          {loadingLenders ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF9500" />
              <Text style={styles.loadingText}>Loading lenders...</Text>
            </View>
          ) : lenders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No finance lenders available. Please add lenders in the admin panel first.</Text>
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedLenderName}
                onValueChange={(itemValue) => setSelectedLenderName(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a lender" value="" />
                {lenders.map((lender) => (
                  <Picker.Item key={lender.id} label={lender.name} value={lender.name} />
                ))}
              </Picker>
            </View>
          )}
        </View>

        {/* Loan Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={loanType}
              onValueChange={(itemValue) => setLoanType(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Chattel Mortgage" value="chattel-mortgage" />
              <Picker.Item label="Personal Loan" value="personal" />
              <Picker.Item label="Lease" value="lease" />
              <Picker.Item label="Commercial Loan" value="commercial" />
              <Picker.Item label="Hire Purchase" value="hire-purchase" />
              <Picker.Item label="Novated Lease" value="novated-lease" />
            </Picker>
          </View>
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loan Amount ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30000"
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (%) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5.5"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Loan Term (months) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              value={termMonths}
              onChangeText={setTermMonths}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Payment (Auto-calculated)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Will be calculated"
              value={monthlyPayment}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date (DD/MM/YYYY) *</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              value={startDateText}
              onChangeText={formatStartDateInput}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {termMonths && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date (Auto-calculated)</Text>
              <View style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
                <Text style={styles.dateText}>{format(calculateEndDate(), 'dd MMM yyyy')}</Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || vehicles.length === 0}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Finance...' : 'Add Finance Product'}
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
    borderColor: '#FF9500',
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
    backgroundColor: '#FF9500',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 10,
    color: '#8E8E93',
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#8E8E93',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  emptyBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
});