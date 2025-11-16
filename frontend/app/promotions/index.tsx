import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Linking,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface Banner {
  id: string;
  banner_type: string;
  provider_name: string;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  image_url?: string;
  display_mode: 'text_overlay' | 'full_image';
  target_audience: string;
  status: string;
  priority: number;
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
}

export default function Promotions() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'Finance' | 'Insurance' | 'Roadside' | 'Service'>('all');

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/promotions?status=active');
      setPromotions(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const filteredPromotions = filter === 'all' 
    ? promotions 
    : promotions.filter(p => p.category === filter);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Finance': return '#FF9500';
      case 'Insurance': return '#34C759';
      case 'Roadside': return '#FF3B30';
      case 'Service': return '#5856D6';
      default: return '#007AFF';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Finance': return 'cash';
      case 'Insurance': return 'shield-checkmark';
      case 'Roadside': return 'car-sport';
      case 'Service': return 'construct';
      default: return 'pricetag';
    }
  };

  const PromotionCard = ({ promotion }: { promotion: Promotion }) => (
    <TouchableOpacity 
      style={styles.promotionCard}
      onPress={() => router.push(`/promotions/${promotion.id}`)}
    >
      <View style={[styles.categoryBanner, { backgroundColor: getCategoryColor(promotion.category) }]}>
        <Ionicons name={getCategoryIcon(promotion.category) as any} size={20} color="#fff" />
        <Text style={styles.categoryText}>{promotion.category}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{promotion.discount_details}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.promotionTitle}>{promotion.title}</Text>
        <Text style={styles.promotionDescription} numberOfLines={2}>{promotion.description}</Text>
        
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={14} color="#8E8E93" />
          <Text style={styles.dateText}>
            Valid until {format(new Date(promotion.end_date), 'dd MMM yyyy')}
          </Text>
        </View>

        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'Insurance' && styles.filterChipActive]}
          onPress={() => setFilter('Insurance')}
        >
          <Text style={[styles.filterChipText, filter === 'Insurance' && styles.filterChipTextActive]}>Insurance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'Finance' && styles.filterChipActive]}
          onPress={() => setFilter('Finance')}
        >
          <Text style={[styles.filterChipText, filter === 'Finance' && styles.filterChipTextActive]}>Finance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filter === 'Roadside' && styles.filterChipActive]}
          onPress={() => setFilter('Roadside')}
        >
          <Text style={[styles.filterChipText, filter === 'Roadside' && styles.filterChipTextActive]}>Roadside</Text>
        </TouchableOpacity>
      </View>

      {filteredPromotions.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No promotions available</Text>
          <Text style={styles.emptySubtext}>Check back later for special offers</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPromotions}
          renderItem={({ item }) => <PromotionCard promotion={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchPromotions} />
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  promotionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
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
  },
});