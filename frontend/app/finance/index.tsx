import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
}

export default function Finance() {
  const router = useRouter();
  const [products, setProducts] = useState<FinanceProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/finance-loans');
      console.log('Finance API response:', response.data);
      
      // Access nested data structure from live API
      const productsData = response.data?.data?.loans || [];
      console.log('Parsed finance loans:', productsData);
      
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error fetching finance loans:', error);
      Alert.alert('Error', 'Failed to load finance loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const FinanceCard = ({ product }: { product: FinanceProduct }) => (
    <TouchableOpacity 
      style={styles.financeCard}
      onPress={() => router.push(`/finance/${product.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="cash" size={24} color="#FF9500" />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: product.status === 'Active' ? '#34C75920' : '#8E8E9320' }]}>
          <Text style={[styles.statusText, { color: product.status === 'Active' ? '#34C759' : '#8E8E93' }]}>
            {product.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Outstanding Balance</Text>
        <Text style={styles.amountValue}>${product.outstanding_balance.toLocaleString()}</Text>
      </View>
      
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Monthly Payment</Text>
          <Text style={styles.detailValue}>${product.monthly_payment}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{product.interest_rate}%</Text>
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((product.loan_amount - product.outstanding_balance) / product.loan_amount) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(((product.loan_amount - product.outstanding_balance) / product.loan_amount) * 100)}% paid
        </Text>
      </View>
      
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
        <Text style={styles.dateText}>Ends: {format(new Date(product.end_date), 'dd MMM yyyy')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance & Loans</Text>
        <View style={{ width: 40 }} />
      </View>

      {products.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No finance products</Text>
          <Text style={styles.emptySubtext}>Add your first loan or finance product</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/finance/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Finance</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <FinanceCard product={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchProducts} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.addFinanceButton}
              onPress={() => router.push('/finance/add')}
            >
              <Ionicons name="add-circle" size={24} color="#FF9500" />
              <Text style={styles.addFinanceText}>Add New Finance Product</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
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
  list: {
    padding: 16,
  },
  addFinanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addFinanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  financeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF950020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountSection: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});