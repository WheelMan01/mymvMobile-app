import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://photo-showroom-app.preview.emergentagent.com';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  rego: string;
}

interface Transfer {
  id: string;
  vehicle: Vehicle;
  new_owner_name: string;
  new_owner_member_number: string;
  created_at: string;
}

interface QuarantinedVehicle extends Vehicle {
  quarantine_end_date: string;
}

export default function TransfersTab() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([]);
  const [quarantinedVehicles, setQuarantinedVehicles] = useState<QuarantinedVehicle[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    vehicle_id: '',
    new_owner_member_number: '',
    new_owner_name: '',
    new_owner_mobile: '',
    new_owner_email: '',
  });

  const subscriptionTier = user?.subscription_tier || 'basic';
  const isPremium = ['premium_monthly', 'premium_annual'].includes(subscriptionTier);

  useEffect(() => {
    if (isPremium) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      // Load vehicles
      const vehiclesRes = await axios.get(`${API_URL}/api/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVehicles(vehiclesRes.data.data?.vehicles || []);

      // Load pending transfers
      const transfersRes = await axios.get(`${API_URL}/api/transfers/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingTransfers(transfersRes.data.data?.transfers || []);

      // Load quarantined vehicles
      const quarantinedRes = await axios.get(`${API_URL}/api/transfers/quarantined`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuarantinedVehicles(quarantinedRes.data.data?.vehicles || []);
    } catch (error) {
      console.error('Failed to load transfer data:', error);
    }
  };

  const handleLookup = async () => {
    if (!formData.new_owner_member_number.trim()) {
      setErrorMessage('Please enter a member number');
      return;
    }

    setIsLookingUp(true);
    setErrorMessage('');

    try {
      const response = await axios.get(
        `${API_URL}/api/users/lookup/${formData.new_owner_member_number}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userData = response.data.data;
      setFormData({
        ...formData,
        new_owner_name: `${userData.first_name} ${userData.last_name}`,
        new_owner_mobile: userData.mobile,
        new_owner_email: userData.email,
      });
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Member not found');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!formData.vehicle_id) {
      setErrorMessage('Please select a vehicle');
      return;
    }
    if (!formData.new_owner_name || !formData.new_owner_email) {
      setErrorMessage('Please lookup the new owner first');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      await axios.post(`${API_URL}/api/transfers/initiate`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowSuccess(true);
      setFormData({
        vehicle_id: '',
        new_owner_member_number: '',
        new_owner_name: '',
        new_owner_mobile: '',
        new_owner_email: '',
      });
      setTimeout(() => setShowSuccess(false), 3000);

      // Reload data
      await loadData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to initiate transfer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    Alert.alert(
      'Cancel Transfer?',
      'Are you sure you want to cancel this transfer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/api/transfers/${transferId}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await loadData();
              Alert.alert('Success', 'Transfer cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel transfer');
            }
          },
        },
      ]
    );
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleUpgrade = () => {
    router.push('/(tabs)/settings');
    // The settings screen will default to first tab, but user can switch to billing
  };

  // Basic user view - upgrade prompt
  if (!isPremium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.upgradeBanner}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#00BFFF" />
          </View>
          <Text style={styles.upgradeBannerTitle}>🔒 Premium Feature Required</Text>
          <Text style={styles.upgradeBannerText}>
            Upgrade to a Premium plan to transfer vehicles with complete service history and all
            associated records.
          </Text>
          <View style={styles.upgradeButtonsContainer}>
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>✨ Upgrade Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.maybeLaterButton} onPress={() => router.back()}>
              <Text style={styles.maybeLaterText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.formContainer, styles.disabledForm]}>
          <Text style={styles.disabledFormLabel}>Transfer a Vehicle (Premium Only)</Text>
          <View style={styles.disabledFormContent}>
            <Text style={styles.disabledFormText}>
              This form is available only to Premium members
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Premium user view
  return (
    <ScrollView style={styles.container}>
      {showSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#166534" />
          <Text style={styles.successText}>
            Transfer request submitted successfully! The new owner will receive an email
            notification.
          </Text>
        </View>
      )}

      {errorMessage !== '' && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={20} color="#991b1b" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage('')}>
            <Ionicons name="close" size={20} color="#991b1b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Transfer Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transfer a Vehicle</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Vehicle</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
                style={styles.picker}
                dropdownIconColor="#fff"
              >
                <Picker.Item label="Choose a vehicle..." value="" />
                {vehicles.map((vehicle) => (
                  <Picker.Item
                    key={vehicle.id}
                    label={`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.rego}`}
                    value={vehicle.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Owner Member Number</Text>
            <View style={styles.lookupContainer}>
              <TextInput
                style={[styles.input, styles.lookupInput]}
                value={formData.new_owner_member_number}
                onChangeText={(text) =>
                  setFormData({ ...formData, new_owner_member_number: text })
                }
                placeholder="MV-1234567"
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.lookupButton}
                onPress={handleLookup}
                disabled={isLookingUp}
              >
                {isLookingUp ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.lookupButtonText}>Lookup</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.new_owner_name}
              onChangeText={(text) => setFormData({ ...formData, new_owner_name: text })}
              placeholder="Auto-populated after lookup"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.new_owner_mobile}
              onChangeText={(text) => setFormData({ ...formData, new_owner_mobile: text })}
              placeholder="Auto-populated after lookup"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.new_owner_email}
              onChangeText={(text) => setFormData({ ...formData, new_owner_email: text })}
              placeholder="Auto-populated after lookup"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.buttonDisabled]}
            onPress={handleSubmitTransfer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Transfer Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Transfers */}
      {pendingTransfers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color="#fbbf24" />
            <Text style={styles.sectionTitle}>Pending Transfers ({pendingTransfers.length})</Text>
          </View>

          {pendingTransfers.map((transfer) => (
            <View key={transfer.id} style={styles.pendingCard}>
              <View style={styles.pendingCardHeader}>
                <Text style={styles.pendingCardTitle}>
                  {transfer.vehicle.year} {transfer.vehicle.make} {transfer.vehicle.model}
                </Text>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelTransfer(transfer.id)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.pendingCardText}>Rego: {transfer.vehicle.rego}</Text>
              <Text style={styles.pendingCardText}>
                Transferring to: {transfer.new_owner_name} ({transfer.new_owner_member_number})
              </Text>
              <Text style={styles.pendingCardDate}>
                Requested: {new Date(transfer.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Quarantined Vehicles */}
      {quarantinedVehicles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
              Quarantined Vehicles - Pending Deletion ({quarantinedVehicles.length})
            </Text>
          </View>

          {quarantinedVehicles.map((vehicle) => {
            const daysRemaining = getDaysRemaining(vehicle.quarantine_end_date);
            const isUrgent = daysRemaining <= 7;

            return (
              <View key={vehicle.id} style={styles.quarantinedCard}>
                <Text style={styles.quarantinedCardTitle}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.quarantinedCardText}>Rego: {vehicle.rego}</Text>

                <View style={styles.countdownBox}>
                  <Ionicons
                    name={isUrgent ? 'alarm-outline' : 'hourglass-outline'}
                    size={20}
                    color="#000"
                  />
                  <Text style={styles.countdownText}>
                    {daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : 'Deletion imminent'}
                  </Text>
                </View>

                <Text style={styles.quarantinedCardInfo}>
                  Vehicle will be permanently deleted on{' '}
                  {new Date(vehicle.quarantine_end_date).toLocaleDateString()}
                </Text>
                <Text style={styles.quarantinedCardWarning}>
                  This vehicle is read-only and will be automatically deleted if not transferred
                  within the quarantine period.
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  upgradeBanner: {
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeBannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeBannerText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#00BFFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  maybeLaterButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  maybeLaterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledForm: {
    opacity: 0.5,
  },
  disabledFormLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  disabledFormContent: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
  },
  disabledFormText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#000',
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  lookupContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
  },
  lookupButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  lookupButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#06b6d4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pendingCard: {
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  cancelButton: {
    padding: 4,
  },
  pendingCardText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  pendingCardDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  quarantinedCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  quarantinedCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  quarantinedCardText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 8,
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  quarantinedCardInfo: {
    fontSize: 12,
    color: '#000',
    marginBottom: 8,
  },
  quarantinedCardWarning: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
