import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '../../components/AppHeader';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { format } from 'date-fns';

interface FinanceProduct {
  id: string;
  user_id: string;
  vehicle_id: string;
  lender: string;
  loan_type: string;
  loan_amount: number;
  interest_rate: number;
  loan_term_months: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  account_number?: string;
  notes?: string;
  documents?: string[];
  lender_phone?: string;
  lender_email?: string;
  lender_website?: string;
  lender_logo?: string;
}

interface Vehicle {
  id: string;
  rego_number: string;
  make: string;
  model: string;
  year: number;
}

export default function Finance() {
  const router = useRouter();
  const [products, setProducts] = useState<FinanceProduct[]>([]);
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/finance-loans');
      console.log('Finance API response:', response.data);
      
      const productsData = response.data?.data?.loans || [];
      console.log('Parsed finance loans:', productsData);
      
      setProducts(productsData);
      
      // Fetch vehicles for each loan with timeout
      const vehicleIds = [...new Set(productsData.map((p: FinanceProduct) => p.vehicle_id))];
      const vehicleMap: { [key: string]: Vehicle } = {};
      
      const fetchWithTimeout = async (vehicleId: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const vehicleResponse = await api.get(`/vehicles/${vehicleId}`);
          clearTimeout(timeoutId);
          
          const vehicleData = vehicleResponse.data?.data?.vehicle || vehicleResponse.data;
          vehicleMap[vehicleId] = vehicleData;
        } catch (error) {
          console.error(`Error fetching vehicle ${vehicleId}:`, error);
          // Create placeholder vehicle data
          vehicleMap[vehicleId] = {
            id: vehicleId,
            rego_number: 'Unknown',
            make: 'Unknown',
            model: 'Vehicle',
            year: 0,
          };
        }
      };
      
      await Promise.allSettled(
        vehicleIds.map((vehicleId) => fetchWithTimeout(vehicleId))
      );
      
      console.log('✅ Vehicles fetched:', Object.keys(vehicleMap).length);
      setVehicles(vehicleMap);
    } catch (error: any) {
      console.error('Error fetching finance loans:', error);
      Alert.alert('Error', 'Failed to load finance loans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Finance screen focused - refreshing data');
      fetchProducts();
    }, [])
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Calculate months remaining
  const calculateMonthsRemaining = (endDate: string): number => {
    const today = new Date();
    const end = new Date(endDate);
    const yearsDiff = end.getFullYear() - today.getFullYear();
    const monthsDiff = end.getMonth() - today.getMonth();
    return Math.max(0, (yearsDiff * 12) + monthsDiff);
  };

  // Calculate outstanding balance
  const calculateOutstandingBalance = (
    loanAmount: number,
    monthlyPayment: number,
    startDate: string,
    endDate: string
  ): number => {
    const monthsRemaining = calculateMonthsRemaining(endDate);
    const outstanding = monthlyPayment * monthsRemaining;
    return Math.max(0, outstanding);
  };

  // Get loan status
  const getLoanStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) {
      return { status: 'UPCOMING', color: '#3B82F6', text: 'UPCOMING' };
    } else if (today > end) {
      return { status: 'PAID_OFF', color: '#10B981', text: 'PAID OFF' };
    } else {
      return { status: 'ACTIVE', color: '#F59E0B', text: 'ACTIVE' };
    }
  };

  // Format loan type
  const formatLoanType = (loanType: string): string => {
    const types: { [key: string]: string } = {
      'personal': 'Personal Loan',
      'chattel-mortgage': 'Chattel Mortgage',
      'lease': 'Lease',
      'commercial': 'Commercial Loan',
      'hire-purchase': 'Hire Purchase',
      'novated-lease': 'Novated Lease',
    };
    return types[loanType] || loanType;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Button Handlers
  const handleCallLender = (product: FinanceProduct) => {
    if (!product.lender_phone) {
      Alert.alert('No Phone Number', 'Lender phone number is not available.');
      return;
    }

    Alert.alert(
      'Call Lender',
      `Call ${product.lender} at ${product.lender_phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            const formattedNumber = product.lender_phone!.replace(/\s+/g, '');
            const telURL = `tel:${formattedNumber}`;
            try {
              const canOpen = await Linking.canOpenURL(telURL);
              if (canOpen) {
                await Linking.openURL(telURL);
              } else {
                Alert.alert('Error', 'Cannot open phone dialer');
              }
            } catch (error) {
              console.error('Error opening dialer:', error);
              Alert.alert('Error', 'Failed to open phone dialer');
            }
          },
        },
      ]
    );
  };

  const handleVisitWebsite = async (product: FinanceProduct) => {
    if (!product.lender_website) {
      Alert.alert('No Website', 'Lender website is not available.');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(product.lender_website);
      if (canOpen) {
        await Linking.openURL(product.lender_website);
      } else {
        Alert.alert('Error', 'Cannot open website');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Failed to open website');
    }
  };

  const handleEdit = (product: FinanceProduct) => {
    router.push({
      pathname: '/finance/edit',
      params: {
        id: product.id,
        vehicle_id: product.vehicle_id,
        lender: product.lender,
        loan_type: product.loan_type,
        loan_amount: product.loan_amount.toString(),
        interest_rate: product.interest_rate.toString(),
        loan_term_months: product.loan_term_months.toString(),
        monthly_payment: product.monthly_payment.toString(),
        start_date: product.start_date,
        end_date: product.end_date,
        account_number: product.account_number || '',
        notes: product.notes || '',
      },
    });
  };

  const handleDelete = (product: FinanceProduct) => {
    Alert.alert(
      'Delete Finance Loan',
      `Are you sure you want to delete this ${product.lender} loan? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting loan:', product.id);
              const response = await api.delete(`/finance-loans/${product.id}`);
              console.log('✅ Delete response:', response);
              
              Alert.alert(
                'Success',
                'Finance loan deleted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      fetchProducts();
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Error deleting loan:', error);
              const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete loan';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  const DetailedFinanceCard = ({ product }: { product: FinanceProduct }) => {
    const vehicle = vehicles[product.vehicle_id];
    const status = getLoanStatus(product.start_date, product.end_date);
    const monthsRemaining = calculateMonthsRemaining(product.end_date);
    const outstandingBalance = calculateOutstandingBalance(
      product.loan_amount,
      product.monthly_payment,
      product.start_date,
      product.end_date
    );

    // Show card with placeholder if vehicle not loaded yet
    const vehicleDisplay = vehicle 
      ? `${vehicle.rego_number} - ${vehicle.make} ${vehicle.model}`
      : 'Loading vehicle...';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="card" size={28} color="#FCD34D" />
            <Text style={styles.headerTitle}>
              {vehicleDisplay}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{formatLoanType(product.loan_type).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusBadgeText}>{status.text}</Text>
          </View>
        </View>

        {/* Lender */}
        <Text style={styles.lender}>{product.lender}</Text>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailColumn}>
            <Text style={styles.label}>Account Number</Text>
            <Text style={styles.value}>{product.account_number || 'N/A'}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Loan Type</Text>
            <Text style={styles.value}>{formatLoanType(product.loan_type)}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Start Date</Text>
            <Text style={styles.value}>{format(new Date(product.start_date), 'dd/MM/yyyy')}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>End Date</Text>
            <Text style={styles.value}>{format(new Date(product.end_date), 'dd/MM/yyyy')}</Text>
            <Text style={styles.daysRemaining}>{monthsRemaining} months remaining</Text>
          </View>

          <View style={styles.detailColumn}>
            <Text style={styles.label}>Loan Amount</Text>
            <Text style={styles.value}>{formatCurrency(product.loan_amount)}</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Interest Rate</Text>
            <Text style={styles.value}>{product.interest_rate}%</Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Loan Term</Text>
            <Text style={styles.value}>
              {product.loan_term_months} months ({(product.loan_term_months / 12).toFixed(1)} years)
            </Text>

            <Text style={[styles.label, { marginTop: 20 }]}>Monthly Payment</Text>
            <Text style={styles.value}>{formatCurrency(product.monthly_payment)}</Text>
          </View>
        </View>

        {/* Outstanding Balance Section */}
        <View style={styles.outstandingSection}>
          <Text style={styles.label}>Outstanding Balance (Estimated)</Text>
          <Text style={[styles.value, { fontSize: 28, color: '#FCD34D' }]}>
            {formatCurrency(outstandingBalance)}
          </Text>
        </View>

        {/* Notes Section */}
        {product.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notesText}>{product.notes}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Secondary Actions - Two Column Grid */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleCallLender(product)}>
              <Ionicons name="call-outline" size={20} color="#FCD34D" />
              <Text style={styles.secondaryButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => handleVisitWebsite(product)}>
              <Ionicons name="globe-outline" size={20} color="#FCD34D" />
              <Text style={styles.secondaryButtonText}>Website</Text>
            </TouchableOpacity>
          </View>

          {/* Edit and Delete - Two Column Grid */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(product)}>
              <Ionicons name="create-outline" size={20} color="#10B981" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(product)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title="Finance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FCD34D" />
          <Text style={styles.loadingText}>Loading loans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Finance" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Add Loan Button */}
        <TouchableOpacity
          style={styles.addLoanButton}
          onPress={() => router.push('/finance/add')}
        >
          <Ionicons name="add-circle" size={24} color="#FCD34D" />
          <Text style={styles.addLoanText}>Add New Loan</Text>
        </TouchableOpacity>

        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>No finance loans</Text>
            <Text style={styles.emptySubtext}>Add a loan to track your vehicle finance</Text>
          </View>
        ) : (
          products.map((product) => (
            <DetailedFinanceCard key={product.id} product={product} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  addLoanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addLoanText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCD34D',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lender: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 20,
  },
  detailColumn: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  daysRemaining: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic',
  },
  outstandingSection: {
    backgroundColor: '#0F172A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  actions: {
    gap: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FCD34D',
    fontWeight: '600',
    fontSize: 15,
  },
  refinanceButton: {
    backgroundColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  refinanceButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 15,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 15,
  },
});
