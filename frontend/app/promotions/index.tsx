import React, { useState, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
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

  if (loading && promos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00BFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Exclusive Promotions</Text>
            <Text style={styles.headerSubtitle}>
              Amazing deals from our trusted partners
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BFFF" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </View>
    );
  }

  if (promos.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00BFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Exclusive Promotions</Text>
            <Text style={styles.headerSubtitle}>
              Amazing deals from our trusted partners
            </Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏷️</Text>
          <Text style={styles.emptyText}>No promotions available</Text>
          <Text style={styles.emptySubtext}>
            Check back soon for exciting new offers from our partners!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Promotions" />

      {/* Promo List */}
      <FlatList
        data={promos}
        renderItem={renderPromo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadPromos}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a', // Dark background like web app
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 48,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 12,
    fontSize: 14,
  },
  promoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  featuredBadge: {
    backgroundColor: '#fbbf24',
    paddingVertical: 8,
    alignItems: 'center',
  },
  featuredText: {
    color: '#1a1a1a',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    alignItems: 'center',
  },
  premiumText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 14,
    color: '#00BFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 16,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  promoCodeLeft: {
    flex: 1,
  },
  promoCodeLabel: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  promoCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  copyButton: {
    padding: 8,
  },
  copyIcon: {
    fontSize: 20,
  },
  copiedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  expiryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  expiryText: {
    fontSize: 13,
    color: '#fff',
  },
  claimButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});