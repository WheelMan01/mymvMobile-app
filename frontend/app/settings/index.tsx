import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import AppHeader from '../../components/AppHeader';
import { Picker } from '@react-native-picker/picker';

type TabType = 'account' | 'security' | 'notifications' | 'billing' | 'transfers';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('account');
  
  // Account tab states
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });
  
  // Security tab states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordError, setPasswordError] = useState('');
  
  // Notifications tab states
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [notifications, setNotifications] = useState({
    sms: true,
    email: true,
    push: true,
    alert_reminders: true,
    service_reminders: true,
  });
  
  // Billing tab states
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  
  // Transfers tab states
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({
    vehicle_id: '',
    new_owner_member_number: '',
    new_owner_name: '',
    new_owner_mobile: '',
    new_owner_email: '',
  });
  const [lookupLoading, setLookupLoading] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [quarantinedVehicles, setQuarantinedVehicles] = useState<any[]>([]);
  
  // General states
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationPreferences();
    }
    if (activeTab === 'transfers') {
      loadTransferData();
    }
  }, [activeTab]);

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    try {
      const response = await api.get('/user/notification-preferences');
      if (response.data?.preferences) {
        setNotifications(response.data.preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  // Load transfer data
  const loadTransferData = async () => {
    try {
      const vehiclesRes = await api.get('/vehicles');
      setVehicles(vehiclesRes.data?.data?.vehicles || []);
      
      const pendingRes = await api.get('/transfers/pending');
      setPendingTransfers(pendingRes.data?.data?.transfers || []);
      
      const quarantinedRes = await api.get('/transfers/quarantined');
      setQuarantinedVehicles(quarantinedRes.data?.data?.vehicles || []);
    } catch (error) {
      console.error('Error loading transfer data:', error);
    }
  };

  // Account tab handlers
  const handleSaveAccount = async () => {
    setLoading(true);
    setSuccessMessage('');
    try {
      await api.put('/user/profile', profileData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditingAccount(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Security tab handlers
  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/user/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setSuccessMessage('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Notifications tab handlers
  const handleSaveNotifications = async () => {
    setLoading(true);
    setSuccessMessage('');
    try {
      await api.put('/user/notification-preferences', notifications);
      setSuccessMessage('Notification preferences updated successfully!');
      setIsEditingNotifications(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  // Billing tab handlers
  const handleUpgradeSubscription = async (tier: string) => {
    Alert.alert(
      'Confirm Upgrade',
      `Upgrade to ${tier === 'premium_monthly' ? 'Premium Monthly ($4.99/month)' : 'Premium Annual ($39/year)'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              await api.post('/user/upgrade-subscription', { subscription_tier: tier });
              setSuccessMessage(`Successfully upgraded to ${tier}!`);
              setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to upgrade');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancellation = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }
    
    if (confirmationText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/user/request-cancellation', { reason: cancellationReason });
      Alert.alert(
        'Account Suspended',
        'Your account has been suspended. You will be logged out.',
        [{ text: 'OK', onPress: async () => {
          await logout();
          router.replace('/auth/login');
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit cancellation');
    } finally {
      setLoading(false);
      setShowCancellationModal(false);
    }
  };

  // Transfer tab handlers
  const handleLookupMember = async () => {
    if (!transferForm.new_owner_member_number) {
      Alert.alert('Error', 'Please enter a member number');
      return;
    }
    
    setLookupLoading(true);
    try {
      const response = await api.get(`/users/lookup/${transferForm.new_owner_member_number}`);
      const member = response.data?.data;
      
      setTransferForm(prev => ({
        ...prev,
        new_owner_name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        new_owner_mobile: member.mobile || '',
        new_owner_email: member.email || '',
      }));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Member not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitTransfer = async () => {
    setLoading(true);
    try {
      await api.post('/transfers/initiate', transferForm);
      setSuccessMessage('Transfer request submitted successfully!');
      setTransferForm({
        vehicle_id: '',
        new_owner_member_number: '',
        new_owner_name: '',
        new_owner_mobile: '',
        new_owner_email: '',
      });
      await loadTransferData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit transfer');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Tab navigation component
  const TabButton = ({ label, value }: { label: string; value: TabType }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === value && styles.activeTabButton]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabButtonText, activeTab === value && styles.activeTabButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Settings" />
      
      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Tab Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabNav}>
        <TabButton label="Account" value="account" />
        <TabButton label="Security" value="security" />
        <TabButton label="Notifications" value="notifications" />
        <TabButton label="Billing" value="billing" />
        <TabButton label="Transfers" value="transfers" />
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        
        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {!isEditingAccount ? (
                <TouchableOpacity onPress={() => setIsEditingAccount(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSaveAccount}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setIsEditingAccount(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, !isEditingAccount && styles.disabledInput]}
                value={profileData.first_name}
                onChangeText={(text) => setProfileData({...profileData, first_name: text})}
                editable={isEditingAccount}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, !isEditingAccount && styles.disabledInput]}
                value={profileData.last_name}
                onChangeText={(text) => setProfileData({...profileData, last_name: text})}
                editable={isEditingAccount}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, !isEditingAccount && styles.disabledInput]}
                value={profileData.email}
                onChangeText={(text) => setProfileData({...profileData, email: text})}
                editable={isEditingAccount}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, !isEditingAccount && styles.disabledInput]}
                value={profileData.mobile}
                onChangeText={(text) => setProfileData({...profileData, mobile: text})}
                editable={isEditingAccount}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Security & Privacy</Text>
            
            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Password & Authentication</Text>
              
              {!showPasswordForm ? (
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => setShowPasswordForm(true)}
                >
                  <Ionicons name="key-outline" size={20} color="#00BFFF" />
                  <Text style={styles.optionButtonText}>Change Password</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordFormContainer}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                      setPasswordError('');
                    }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {passwordError ? (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={20} color="#ef4444" />
                      <Text style={styles.errorText}>{passwordError}</Text>
                    </View>
                  ) : null}

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordForm.current_password}
                      onChangeText={(text) => setPasswordForm({...passwordForm, current_password: text})}
                      secureTextEntry
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordForm.new_password}
                      onChangeText={(text) => setPasswordForm({...passwordForm, new_password: text})}
                      secureTextEntry
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={passwordForm.confirm_password}
                      onChangeText={(text) => setPasswordForm({...passwordForm, confirm_password: text})}
                      secureTextEntry
                      placeholderTextColor="#666"
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.submitButton}
                    onPress={handleChangePassword}
                    disabled={loading}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? 'Changing...' : 'Change Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Additional Security</Text>
              <TouchableOpacity style={[styles.optionButton, styles.disabledButton]} disabled>
                <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
                <Text style={[styles.optionButtonText, { color: '#666' }]}>
                  Two-Factor Authentication (Coming Soon)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>
              {!isEditingNotifications ? (
                <TouchableOpacity onPress={() => setIsEditingNotifications(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveNotifications}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setIsEditingNotifications(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Notification Methods</Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="mail-outline" size={20} color="#fff" />
                  <Text style={styles.switchText}>Email Notifications</Text>
                </View>
                <Switch
                  value={notifications.email}
                  onValueChange={(value) => setNotifications({...notifications, email: value})}
                  disabled={!isEditingNotifications}
                  trackColor={{ false: '#3e3e3e', true: '#00BFFF' }}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                  <Text style={styles.switchText}>SMS Notifications</Text>
                </View>
                <Switch
                  value={notifications.sms}
                  onValueChange={(value) => setNotifications({...notifications, sms: value})}
                  disabled={!isEditingNotifications}
                  trackColor={{ false: '#3e3e3e', true: '#00BFFF' }}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                  <Text style={styles.switchText}>Push Notifications</Text>
                </View>
                <Switch
                  value={notifications.push}
                  onValueChange={(value) => setNotifications({...notifications, push: value})}
                  disabled={!isEditingNotifications}
                  trackColor={{ false: '#3e3e3e', true: '#00BFFF' }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>Alert Types</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Renewal Reminders</Text>
                <Switch
                  value={notifications.alert_reminders}
                  onValueChange={(value) => setNotifications({...notifications, alert_reminders: value})}
                  disabled={!isEditingNotifications}
                  trackColor={{ false: '#3e3e3e', true: '#00BFFF' }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Service Reminders</Text>
                <Switch
                  value={notifications.service_reminders}
                  onValueChange={(value) => setNotifications({...notifications, service_reminders: value})}
                  disabled={!isEditingNotifications}
                  trackColor={{ false: '#3e3e3e', true: '#00BFFF' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Plan & Billing</Text>
            
            {/* Basic Plan Layout */}
            {(!user?.subscription_tier || user?.subscription_tier === 'basic') && (
              <View>
                <View style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>Basic Plan</Text>
                      <Text style={styles.planPrice}>FREE</Text>
                    </View>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.featureText}>1 Vehicle</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.featureText}>50 MB storage</Text>
                    </View>
                  </View>

                  <View style={styles.upgradePromo}>
                    <Text style={styles.upgradePromoTitle}>🚀 Upgrade to Premium and get:</Text>
                    <Text style={styles.upgradePromoItem}>• Up to 4-6 vehicles</Text>
                    <Text style={styles.upgradePromoItem}>• 500 MB storage</Text>
                    <Text style={styles.upgradePromoItem}>• Transferable service history</Text>
                    <Text style={styles.upgradePromoItem}>• Unlimited document uploads</Text>
                    <Text style={styles.upgradePromoItem}>• Free sell my vehicle</Text>
                    <Text style={styles.upgradePromoItem}>• Priority support</Text>
                  </View>
                </View>

                <Text style={styles.subsectionTitle}>Upgrade Your Plan</Text>
                
                <View style={styles.upgradeCards}>
                  {/* Monthly Plan */}
                  <View style={styles.upgradeCard}>
                    <Text style={styles.upgradeCardTitle}>Premium Monthly</Text>
                    <Text style={styles.upgradeCardPrice}>$4.99<Text style={styles.priceUnit}>/month</Text></Text>
                    <TouchableOpacity 
                      style={styles.upgradeButton}
                      onPress={() => handleUpgradeSubscription('premium_monthly')}
                    >
                      <Text style={styles.upgradeButtonText}>Upgrade to Monthly</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Annual Plan */}
                  <View style={[styles.upgradeCard, styles.annualCard]}>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>SAVE 35%</Text>
                    </View>
                    <Text style={styles.upgradeCardTitle}>Premium Annual</Text>
                    <Text style={styles.upgradeCardPrice}>$39<Text style={styles.priceUnit}>/year</Text></Text>
                    <Text style={styles.freeMonths}>4 months FREE!</Text>
                    <TouchableOpacity 
                      style={[styles.upgradeButton, styles.annualUpgradeButton]}
                      onPress={() => handleUpgradeSubscription('premium_annual')}
                    >
                      <Text style={[styles.upgradeButtonText, { color: '#0891b2' }]}>Upgrade to Annual</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.cancelAccountButton}
                  onPress={() => setShowCancellationModal(true)}
                >
                  <Text style={styles.cancelAccountButtonText}>Request Account Cancellation</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Premium Plan Layout */}
            {(user?.subscription_tier === 'premium_monthly' || user?.subscription_tier === 'premium_annual') && (
              <View>
                <View style={styles.premiumCard}>
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.premiumPlanName}>
                        {user?.subscription_tier === 'premium_monthly' ? 'Premium Monthly' : 'Premium Annual'}
                      </Text>
                      <Text style={styles.premiumPlanPrice}>
                        {user?.subscription_tier === 'premium_monthly' ? '$4.99/month' : '$39/year'}
                      </Text>
                      {user?.subscription_tier === 'premium_annual' && (
                        <Text style={styles.savingsText}>Saving 35% • 4 months FREE!</Text>
                      )}
                    </View>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>

                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>
                        Up to {user?.subscription_tier === 'premium_annual' ? '6' : '4'} vehicles
                        {user?.subscription_tier === 'premium_annual' && ' 🎁'}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>500 MB storage</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>Priority support</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>Transferable service history</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>Unlimited document uploads</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.premiumFeatureText}>Free sell my vehicle</Text>
                    </View>
                  </View>

                  <View style={styles.billingDetails}>
                    <View style={styles.billingRow}>
                      <Text style={styles.billingLabel}>Status:</Text>
                      <Text style={styles.billingValue}>Active</Text>
                    </View>
                    <View style={styles.billingRow}>
                      <Text style={styles.billingLabel}>Billing Cycle:</Text>
                      <Text style={styles.billingValue}>
                        {user?.subscription_tier === 'premium_monthly' ? 'Monthly' : 'Annual'}
                      </Text>
                    </View>
                    <View style={styles.billingRow}>
                      <Text style={styles.billingLabel}>Next Billing:</Text>
                      <Text style={styles.billingValue}>N/A (Test Mode)</Text>
                    </View>
                  </View>
                </View>

                {user?.subscription_tier === 'premium_monthly' && (
                  <View style={styles.upgradeAnnualBanner}>
                    <Text style={styles.upgradeAnnualTitle}>💡 Save 35% with Annual Plan!</Text>
                    <Text style={styles.upgradeAnnualText}>
                      Switch to annual billing and get 4 months free + 2 bonus vehicles (up to 6 total)
                    </Text>
                  </View>
                )}

                <View style={styles.managementActions}>
                  {user?.subscription_tier === 'premium_monthly' && (
                    <TouchableOpacity 
                      style={styles.upgradeAnnualButton}
                      onPress={() => handleUpgradeSubscription('premium_annual')}
                    >
                      <Text style={styles.upgradeAnnualButtonText}>Upgrade to Annual (Save 35%)</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.cancelAccountButton}
                    onPress={() => setShowCancellationModal(true)}
                  >
                    <Text style={styles.cancelAccountButtonText}>Request Cancellation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TRANSFERS TAB */}
        {activeTab === 'transfers' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Vehicle Transfers</Text>
            
            {/* Upgrade banner for Basic users */}
            {(!user?.subscription_tier || user?.subscription_tier === 'basic') && (
              <View style={styles.premiumFeatureBanner}>
                <View style={styles.premiumIconCircle}>
                  <Ionicons name="lock-closed" size={32} color="#00BFFF" />
                </View>
                <Text style={styles.premiumFeatureTitle}>🔒 Premium Feature Required</Text>
                <Text style={styles.premiumFeatureText}>
                  Upgrade to a Premium plan to transfer vehicles with complete service history and all associated records.
                </Text>
                <View style={styles.premiumButtonsRow}>
                  <TouchableOpacity 
                    style={styles.upgradeNowButton}
                    onPress={() => setActiveTab('billing')}
                  >
                    <Text style={styles.upgradeNowButtonText}>✨ Upgrade Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.maybeLaterButton}>
                    <Text style={styles.maybeLaterButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Transfer form - disabled for Basic users */}
            <View style={[
              styles.transferFormCard,
              (!user?.subscription_tier || user?.subscription_tier === 'basic') && styles.disabledCard
            ]}>
              <Text style={styles.cardTitle}>
                Transfer a Vehicle
                {(!user?.subscription_tier || user?.subscription_tier === 'basic') && (
                  <Text style={styles.premiumOnlyText}> (Premium Only)</Text>
                )}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Select Vehicle</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={transferForm.vehicle_id}
                    onValueChange={(value) => setTransferForm({...transferForm, vehicle_id: value})}
                    style={styles.picker}
                    enabled={user?.subscription_tier !== 'basic'}
                  >
                    <Picker.Item label="Choose a vehicle..." value="" />
                    {vehicles.map(vehicle => (
                      <Picker.Item
                        key={vehicle.id}
                        label={`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.rego}`}
                        value={vehicle.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>New Owner Member Number</Text>
                <View style={styles.lookupRow}>
                  <TextInput
                    style={[styles.input, styles.lookupInput]}
                    placeholder="MV-1234567"
                    value={transferForm.new_owner_member_number}
                    onChangeText={(text) => setTransferForm({...transferForm, new_owner_member_number: text})}
                    editable={user?.subscription_tier !== 'basic'}
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity 
                    style={styles.lookupButton}
                    onPress={handleLookupMember}
                    disabled={lookupLoading || user?.subscription_tier === 'basic'}
                  >
                    <Text style={styles.lookupButtonText}>
                      {lookupLoading ? 'Looking...' : 'Lookup'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={transferForm.new_owner_name}
                  onChangeText={(text) => setTransferForm({...transferForm, new_owner_name: text})}
                  editable={user?.subscription_tier !== 'basic'}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile</Text>
                <TextInput
                  style={styles.input}
                  value={transferForm.new_owner_mobile}
                  onChangeText={(text) => setTransferForm({...transferForm, new_owner_mobile: text})}
                  keyboardType="phone-pad"
                  editable={user?.subscription_tier !== 'basic'}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={transferForm.new_owner_email}
                  onChangeText={(text) => setTransferForm({...transferForm, new_owner_email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={user?.subscription_tier !== 'basic'}
                  placeholderTextColor="#666"
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitButton, (user?.subscription_tier === 'basic' || loading) && styles.disabledButton]}
                onPress={handleSubmitTransfer}
                disabled={user?.subscription_tier === 'basic' || loading}
              >
                <Text style={[styles.submitButtonText, { color: '#000' }]}>
                  {loading ? 'Processing...' : 'Submit Transfer Request'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pending Transfers */}
            {pendingTransfers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="time-outline" size={20} color="#fff" />
                  <Text style={styles.subsectionTitle}>Pending Transfers ({pendingTransfers.length})</Text>
                </View>
                {pendingTransfers.map((transfer) => (
                  <View key={transfer.id} style={styles.pendingTransferCard}>
                    <View style={styles.transferCardContent}>
                      <Text style={styles.transferVehicle}>
                        {transfer.vehicle.year} {transfer.vehicle.make} {transfer.vehicle.model}
                      </Text>
                      <Text style={styles.transferDetail}>Rego: {transfer.vehicle.rego}</Text>
                      <Text style={styles.transferDetail}>
                        To: {transfer.new_owner_name} ({transfer.new_owner_member_number})
                      </Text>
                      <Text style={styles.transferDate}>
                        Requested: {new Date(transfer.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.cancelTransferButton}
                      onPress={() => {
                        Alert.alert(
                          'Cancel Transfer?',
                          `Are you sure you want to cancel this transfer to ${transfer.new_owner_name}?`,
                          [
                            { text: 'No', style: 'cancel' },
                            { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                              try {
                                await api.post(`/transfers/${transfer.id}/reject`);
                                setSuccessMessage('Transfer cancelled successfully');
                                await loadTransferData();
                                setTimeout(() => setSuccessMessage(''), 3000);
                              } catch (error) {
                                Alert.alert('Error', 'Failed to cancel transfer');
                              }
                            }}
                          ]
                        );
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={styles.cancelTransferText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Quarantined Vehicles */}
            {quarantinedVehicles.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
                  <Text style={[styles.subsectionTitle, { color: '#ef4444' }]}>
                    Quarantined Vehicles ({quarantinedVehicles.length})
                  </Text>
                </View>
                {quarantinedVehicles.map((vehicle) => {
                  const daysRemaining = getDaysRemaining(vehicle.quarantine_end_date);
                  const emoji = daysRemaining > 7 ? '⏳' : '⏰';
                  const urgency = daysRemaining === 0 ? 'Deletion imminent' : `${daysRemaining} days remaining`;
                  
                  return (
                    <View key={vehicle.id} style={styles.quarantinedCard}>
                      <Text style={styles.quarantinedVehicle}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Text>
                      <Text style={styles.quarantinedDetail}>Rego: {vehicle.rego}</Text>
                      
                      <View style={styles.countdownBox}>
                        <View style={styles.countdownHeader}>
                          <Text style={styles.countdownEmoji}>{emoji}</Text>
                          <Text style={styles.countdownText}>{urgency}</Text>
                        </View>
                        <Text style={styles.deletionDate}>
                          Vehicle will be permanently deleted on {new Date(vehicle.quarantine_end_date).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <Text style={styles.quarantinedNote}>
                        This vehicle is read-only and will be automatically deleted if not transferred within the quarantine period.
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Cancellation Modal */}
      <Modal
        visible={showCancellationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancellationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Account Cancellation</Text>
            <Text style={styles.modalWarning}>
              ⚠️ This action will suspend your account immediately. Your data will be retained for a grace period before permanent deletion.
            </Text>

            <Text style={styles.modalLabel}>Reason for cancellation:</Text>
            <TextInput
              style={styles.modalTextArea}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              multiline
              numberOfLines={4}
              placeholder="Please tell us why you're leaving..."
              placeholderTextColor="#666"
            />

            <Text style={styles.modalLabel}>Type DELETE to confirm:</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmationText}
              onChangeText={setConfirmationText}
              placeholder="DELETE"
              placeholderTextColor="#666"
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCancellationModal(false);
                  setCancellationReason('');
                  setConfirmationText('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={handleCancellation}
                disabled={loading}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {loading ? 'Processing...' : 'Submit Cancellation'}
                </Text>
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
    backgroundColor: '#1C1C1E',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    color: '#065f46',
    fontSize: 14,
    flex: 1,
  },
  tabNav: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 4,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#00BFFF',
  },
  tabButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#00BFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  editButton: {
    color: '#00BFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3C3C3E',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  disabledInput: {
    opacity: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  optionButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  passwordFormContainer: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#00BFFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchText: {
    fontSize: 15,
    color: '#fff',
  },
  planCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  planPrice: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  premiumFeatureText: {
    color: '#fff',
    fontSize: 14,
  },
  upgradePromo: {
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00BFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  upgradePromoTitle: {
    color: '#00BFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  upgradePromoItem: {
    color: '#00BFFF',
    fontSize: 13,
    marginBottom: 4,
  },
  upgradeCards: {
    gap: 12,
    marginBottom: 16,
  },
  upgradeCard: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  annualCard: {
    backgroundColor: '#0891b2',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  upgradeCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  upgradeCardPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  freeMonths: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  annualUpgradeButton: {
    backgroundColor: '#fff',
  },
  upgradeButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelAccountButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelAccountButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
  premiumCard: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  premiumPlanName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  premiumPlanPrice: {
    fontSize: 18,
    color: '#fff',
    marginTop: 4,
  },
  savingsText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  billingDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingLabel: {
    color: '#d1d5db',
    fontSize: 14,
  },
  billingValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeAnnualBanner: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  upgradeAnnualTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  upgradeAnnualText: {
    color: '#fde68a',
    fontSize: 12,
  },
  managementActions: {
    gap: 12,
  },
  upgradeAnnualButton: {
    backgroundColor: '#fbbf24',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeAnnualButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  premiumFeatureBanner: {
    backgroundColor: 'rgba(0, 191, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#00BFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  premiumFeatureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumFeatureText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  upgradeNowButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeNowButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  maybeLaterButton: {
    backgroundColor: '#3C3C3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  maybeLaterButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  transferFormCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  premiumOnlyText: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#8E8E93',
  },
  pickerContainer: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3C3C3E',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
  },
  lookupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupInput: {
    flex: 1,
  },
  lookupButton: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  lookupButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pendingTransferCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transferCardContent: {
    flex: 1,
  },
  transferVehicle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  transferDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  transferDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cancelTransferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  cancelTransferText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  quarantinedCard: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  quarantinedVehicle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  quarantinedDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  countdownBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  countdownEmoji: {
    fontSize: 20,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#854d0e',
  },
  deletionDate: {
    fontSize: 12,
    color: '#854d0e',
  },
  quarantinedNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalWarning: {
    color: '#fbbf24',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalTextArea: {
    backgroundColor: '#3C3C3E',
    borderWidth: 1,
    borderColor: '#4C4C4E',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#3C3C3E',
    borderWidth: 1,
    borderColor: '#4C4C4E',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#3C3C3E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
