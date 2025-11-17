import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { fetchLogosWithCache } from '../../services/logoService';

const { width } = Dimensions.get('window');

interface Stats {
  total_vehicles: number;
  active_insurance_policies: number;
  active_finance_products: number;
  active_roadside_memberships: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ 
    total_vehicles: 0,
    active_insurance_policies: 0,
    active_finance_products: 0,
    active_roadside_memberships: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const [vehiclesResponse, insuranceResponse, roadsideResponse, financeResponse] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/insurance-policies'),
        api.get('/roadside-assistance'),
        api.get('/finance-loans')
      ]);

      const vehicles = vehiclesResponse.status === 'fulfilled' 
        ? (vehiclesResponse.value.data?.data?.vehicles || vehiclesResponse.value.data || [])
        : [];

      const insurancePolicies = insuranceResponse.status === 'fulfilled'
        ? (insuranceResponse.value.data?.data?.policies || [])
        : [];

      const roadsidePolicies = roadsideResponse.status === 'fulfilled'
        ? (roadsideResponse.value.data?.data?.policies || [])
        : [];

      const financeProducts = financeResponse.status === 'fulfilled'
        ? (financeResponse.value.data?.data?.loans || [])
        : [];

      setStats({
        total_vehicles: vehicles.length,
        active_insurance_policies: insurancePolicies.length,
        active_finance_products: financeProducts.length,
        active_roadside_memberships: roadsidePolicies.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const logos = await fetchLogosWithCache();
      // Use dark logo for black header
      if (logos.logo_dark_bg) {
        setLogoUrl(logos.logo_dark_bg);
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  };

  // Feature tile component matching your web app design
  const FeatureTile = ({ title, icon, count, onPress, color = '#007AFF' }: any) => (
    <TouchableOpacity style={styles.featureTile} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.featureTileContent}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
          <Ionicons name={icon} size={40} color={color} />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>({count})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://customer-assets.emergentagent.com/job_62d41ce6-5f2e-494c-ac68-4946e67b7a4b/artifacts/9fx7lxuy_landingpage.jpg' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header with hamburger menu and profile */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              // Open drawer/menu - for now navigate to profile
              router.push('/profile');
            }}
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.brandSection}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logo}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.brandText}>myMV</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
            <Text style={styles.userName}>{user?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Grid of Features - Row 1 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="myMV"
            icon="car"
            count={stats.total_vehicles}
            color="#007AFF"
            onPress={() => router.push('/vehicles')}
          />
          <FeatureTile
            title="myInsurance"
            icon="shield-checkmark"
            count={stats.active_insurance_policies}
            color="#007AFF"
            onPress={() => router.push('/insurance')}
          />
          <FeatureTile
            title="myFinance"
            icon="cash"
            count={stats.active_finance_products}
            color="#007AFF"
            onPress={() => router.push('/finance')}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="myRoadside"
            icon="car-sport"
            count={stats.active_roadside_memberships}
            color="#007AFF"
            onPress={() => router.push('/roadside')}
          />
          <FeatureTile
            title="myService"
            icon="construct"
            color="#007AFF"
            onPress={() => router.push('/service-booking')}
          />
          <FeatureTile
            title="myMarket"
            icon="cart"
            color="#007AFF"
            onPress={() => router.push('/marketplace')}
          />
        </View>

        {/* Row 3 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="Showroom"
            icon="storefront"
            color="#007AFF"
            onPress={() => router.push('/showroom')}
          />
          <FeatureTile
            title="Promotions"
            icon="pricetag"
            color="#007AFF"
            onPress={() => router.push('/promotions')}
          />
          <FeatureTile
            title="Logout"
            icon="log-out"
            color="#007AFF"
            onPress={() => router.push('/auth/login')}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 25,
    paddingBottom: 6,
    backgroundColor: '#000000',
    marginBottom: 280,
  },
  menuButton: {
    padding: 4,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
    maxWidth: 70,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  featureTile: {
    width: (width - 64) / 3,
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featureTileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  countBadge: {
    marginTop: 4,
  },
  countText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
