import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://vehicle-hub-118.preview.emergentagent.com';

export default function BillingTab() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const subscriptionTier = user?.subscription_tier || 'basic';
  const isBasic = subscriptionTier === 'basic';
  const isMonthly = subscriptionTier === 'premium_monthly';
  const isAnnual = subscriptionTier === 'premium_annual';

  const handleUpgrade = async (tier: string) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/user/upgrade-subscription`,
        { subscription_tier: tier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success!',
        `Successfully upgraded to ${tier === 'premium_monthly' ? 'Premium Monthly' : 'Premium Annual'}!`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upgrade subscription');
    } finally {
      setIsLoading(false);
      setShowUpgradeModal(false);
    }
  };

  const handleCancellation = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    if (deleteConfirmation !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/user/request-cancellation`,
        { reason: cancellationReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Account Suspended',
        'Your account has been suspended. You will be logged out.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/auth/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to process cancellation');
    } finally {
      setIsLoading(false);
      setShowCancelModal(false);
    }
  };

  const openUpgradeModal = (plan: string) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Plan Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>

        {isBasic ? (
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Basic Plan</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.planPrice}>FREE</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.featureText}>1 Vehicle</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.featureText}>50 MB storage</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.planCard, styles.premiumCard]}>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: '#fff' }]}>
                {isMonthly ? 'Premium Monthly' : 'Premium Annual'}
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <Text style={[styles.planPrice, { color: '#fff' }]}>
              {isMonthly ? '$4.99/month' : '$39/year'}
            </Text>
            {isAnnual && (
              <Text style={styles.savingsBadge}>Saving 35% • 4 months FREE! 🎉</Text>
            )}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={[styles.featureText, { color: '#fff' }]}>
                  Up to {isAnnual ? '6' : '4'} vehicles
                  {isAnnual && ' 🎁'}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={[styles.featureText, { color: '#fff' }]}>500 MB storage</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={[styles.featureText, { color: '#fff' }]}>Priority support</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={[styles.featureText, { color: '#fff' }]}>
                  Transferable service history
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Upgrade Section for Basic Users */}
      {isBasic && (
        <>
          <View style={styles.upgradePromo}>
            <Text style={styles.upgradePromoTitle}>🚀 Upgrade to Premium and get:</Text>
            <Text style={styles.upgradePromoText}>• Up to 4-6 vehicles</Text>
            <Text style={styles.upgradePromoText}>• 500 MB storage</Text>
            <Text style={styles.upgradePromoText}>• Transferable service history</Text>
            <Text style={styles.upgradePromoText}>• Priority support</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upgrade Your Plan</Text>

            <View style={styles.planGrid}>
              <TouchableOpacity
                style={[styles.upgradePlanCard, styles.monthlyCard]}
                onPress={() => openUpgradeModal('premium_monthly')}
              >
                <Text style={styles.upgradePlanName}>Premium Monthly</Text>
                <Text style={styles.upgradePlanPrice}>$4.99/month</Text>
                <View style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>Upgrade to Monthly</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.upgradePlanCard, styles.annualCard]}
                onPress={() => openUpgradeModal('premium_annual')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 35%</Text>
                </View>
                <Text style={styles.upgradePlanName}>Premium Annual</Text>
                <Text style={styles.upgradePlanPrice}>$39/year</Text>
                <Text style={styles.bonusText}>4 months FREE!</Text>
                <View style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>Upgrade to Annual</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Upgrade Banner for Monthly Users */}
      {isMonthly && (
        <View style={styles.upgradeBanner}>
          <Text style={styles.upgradeBannerTitle}>💡 Save 35% with Annual Plan!</Text>
          <Text style={styles.upgradeBannerText}>
            Switch to annual billing and get 4 months free + 2 bonus vehicles (up to 6 total)
          </Text>
          <TouchableOpacity
            style={styles.upgradeBannerButton}
            onPress={() => openUpgradeModal('premium_annual')}
          >
            <Text style={styles.upgradeBannerButtonText}>Upgrade to Annual (Save 35%)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Account Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Management</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={() => setShowCancelModal(true)}
        >
          <Ionicons name="warning-outline" size={24} color="#ef4444" />
          <Text style={styles.dangerButtonText}>Request Account Cancellation</Text>
        </TouchableOpacity>
      </View>

      {/* Upgrade Confirmation Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Upgrade</Text>
            <Text style={styles.modalText}>
              You're upgrading to{' '}
              {selectedPlan === 'premium_monthly' ? 'Premium Monthly ($4.99/month)' : 'Premium Annual ($39/year)'}
              . Continue?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowUpgradeModal(false)}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => handleUpgrade(selectedPlan)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancellation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Account Cancellation</Text>
            <Text style={[styles.modalText, { color: '#ef4444' }]}>
              ⚠️ This action will suspend your account immediately. Your data will be retained for
              a grace period before permanent deletion.
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Reason for cancellation"
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={cancellationReason}
              onChangeText={setCancellationReason}
            />

            <TextInput
              style={styles.input}
              placeholder='Type "DELETE" to confirm'
              placeholderTextColor="#666"
              value={deleteConfirmation}
              onChangeText={setDeleteConfirmation}
              autoCapitalize="characters"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                  setDeleteConfirmation('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDangerButton]}
                onPress={handleCancellation}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalDangerText}>Submit Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 20,
  },
  premiumCard: {
    backgroundColor: '#06b6d4',
    borderColor: '#0891b2',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  savingsBadge: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresList: {
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
  },
  upgradePromo: {
    backgroundColor: '#06b6d4',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  upgradePromoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  upgradePromoText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  planGrid: {
    gap: 16,
  },
  upgradePlanCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  monthlyCard: {
    backgroundColor: '#3b82f6',
  },
  annualCard: {
    backgroundColor: '#06b6d4',
  },
  saveBadge: {
    backgroundColor: '#fbbf24',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradePlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  upgradePlanPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 14,
    color: '#4ade80',
    fontWeight: '600',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeBanner: {
    backgroundColor: '#fbbf24',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  upgradeBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  upgradeBannerText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
  },
  upgradeBannerButton: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeBannerButtonText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#00BFFF',
  },
  modalConfirmText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDangerButton: {
    backgroundColor: '#ef4444',
  },
  modalDangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
