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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'insurance' | 'finance' | 'roadside'>('all');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'finance', label: 'Finance' },
    { id: 'roadside', label: 'Roadside' },
  ];

  useEffect(() => {
    loadBanners();
  }, [activeTab]);

  const loadBanners = async () => {
    setLoading(true);
    try {
      if (activeTab === 'all') {
        // Load all banner types in parallel
        const responses = await Promise.allSettled([
          api.get('/banners/insurance/active'),
          api.get('/banners/finance/active'),
          api.get('/banners/roadside/active'),
        ]);

        // Extract banners from successful responses
        const allBanners = responses
          .filter(r => r.status === 'fulfilled')
          .map((r: any) => r.value?.data?.data?.banner)
          .filter(b => b !== null && b !== undefined);

        setBanners(allBanners);
      } else {
        // Load specific banner type
        const response = await api.get(`/banners/${activeTab}/active`);
        const banner = response.data?.data?.banner;
        setBanners(banner ? [banner] : []);
      }
    } catch (error: any) {
      console.error('Error loading banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = async (banner: Banner) => {
    try {
      // Track click
      await api.post(`/banners/${banner.id}/click`);

      // Open URL
      if (banner.cta_url && banner.cta_url.startsWith('http')) {
        await Linking.openURL(banner.cta_url);
      }
    } catch (error: any) {
      console.error('Error handling banner click:', error);
      // Still try to open URL even if tracking fails
      if (banner.cta_url && banner.cta_url.startsWith('http')) {
        await Linking.openURL(banner.cta_url);
      }
    }
  };

  const renderBanner = ({ item: banner }: { item: Banner }) => {
    if (banner.display_mode === 'full_image' && banner.image_url) {
      return (
        <TouchableOpacity
          style={styles.bannerCard}
          onPress={() => handleBannerClick(banner)}
        >
          <Image
            source={{ uri: banner.image_url }}
            style={styles.fullImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.bannerCard}>
        {banner.image_url && (
          <Image
            source={{ uri: banner.image_url }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.overlay}>
          <Text style={styles.providerName}>{banner.provider_name}</Text>
          <Text style={styles.title}>{banner.title}</Text>
          <Text style={styles.description} numberOfLines={3}>
            {banner.description}
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => handleBannerClick(banner)}
          >
            <Text style={styles.ctaText}>{banner.cta_text}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.filterContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.filterChip, activeTab === tab.id && styles.filterChipActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.filterChipText, activeTab === tab.id && styles.filterChipTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : banners.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏷️</Text>
          <Text style={styles.emptyText}>No promotions available</Text>
          <Text style={styles.emptySubtext}>Check back later for special offers</Text>
        </View>
      ) : (
        <FlatList
          data={banners}
          renderItem={renderBanner}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={loadBanners}
          refreshing={loading}
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