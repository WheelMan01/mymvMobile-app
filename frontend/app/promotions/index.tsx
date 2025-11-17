import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Linking,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';

interface DirectPromo {
  id: string;
  title: string;
  supplier_name: string;
  description: string;
  promo_code?: string;
  action_type: string;
  action_value: string;
  member_tier: string;
  category?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  image_url?: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export default function Promotions() {
  const router = useRouter();
  const [promos, setPromos] = useState<DirectPromo[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/direct-promos');
      const promosData = response.data?.promos || [];
      setPromos(promosData);
    } catch (error: any) {
      console.error('Error loading promos:', error);
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoClick = async (promo: DirectPromo) => {
    try {
      // Track click
      await api.post(`/direct-promos/${promo.id}/click`);

      // Handle action based on type
      if (promo.action_type === 'link' && promo.action_value) {
        await Linking.openURL(promo.action_value);
      } else if (promo.action_type === 'phone' && promo.action_value) {
        await Linking.openURL(`tel:${promo.action_value}`);
      } else if (promo.action_type === 'email' && promo.action_value) {
        await Linking.openURL(`mailto:${promo.action_value}`);
      }
    } catch (error: any) {
      console.error('Error handling promo click:', error);
    }
  };

  const copyPromoCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderPromo = ({ item: promo }: { item: DirectPromo }) => {
    return (
      <View style={styles.promoCard}>
        {/* Featured Badge */}
        {promo.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐ FEATURED OFFER</Text>
          </View>
        )}

        {/* Premium Badge */}
        {promo.member_tier === 'premium' && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>👑 PREMIUM MEMBERS ONLY</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Header */}
          <Text style={styles.title}>{promo.title}</Text>
          <Text style={styles.supplierName}>{promo.supplier_name}</Text>

          {promo.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{promo.category}</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{promo.description}</Text>

          {/* Promo Code */}
          {promo.promo_code && (
            <View style={styles.promoCodeContainer}>
              <View style={styles.promoCodeLeft}>
                <Text style={styles.promoCodeLabel}>PROMO CODE</Text>
                <Text style={styles.promoCodeValue}>{promo.promo_code}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyPromoCode(promo.promo_code!)}
              >
                {copiedCode === promo.promo_code ? (
                  <Text style={styles.copiedText}>Copied!</Text>
                ) : (
                  <Text style={styles.copyIcon}>📋</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Expiry Date */}
          {promo.end_date && (
            <View style={styles.expiryContainer}>
              <Text style={styles.expiryIcon}>📅</Text>
              <Text style={styles.expiryText}>
                Valid until {formatDate(promo.end_date)}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => handlePromoClick(promo)}
          >
            <Text style={styles.claimButtonText}>
              {promo.action_type === 'link' ? '🔗 Claim Offer' :
               promo.action_type === 'phone' ? '📞 Call Now' :
               promo.action_type === 'email' ? '📧 Email' :
               'Claim Offer'}
            </Text>
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
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backgroundImage: {
    width: '100%',
    height: 220,
    position: 'absolute',
  },
  fullImage: {
    width: '100%',
    height: 200,
  },
  overlay: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    minHeight: 220,
  },
  providerName: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
});