import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, Dimensions, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { fetchLogosWithCache } from '../../services/logoService';
import HamburgerMenu from '../../components/HamburgerMenu';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');

interface Stats {
  total_vehicles: number;
  active_insurance_policies: number;
  active_finance_products: number;
  active_roadside_memberships: number;
}

// Helper function to get initials
const getInitials = (name: string): string => {
  if (!name) return 'U';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

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
  const [menuVisible, setMenuVisible] = useState(false);

  // Load Poppins fonts
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

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

  // Feature tile component with modern, slim icons
  const FeatureTile = ({ title, icon, onPress, color = '#00BFFF', customIcon }: any) => (
    <TouchableOpacity style={styles.featureTile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.featureTileContent}>
        <View style={styles.iconContainer}>
          {customIcon ? (
            customIcon
          ) : (
            <Ionicons name={icon} size={48} color={color} />
          )}
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFFF" />
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
            onPress={() => setMenuVisible(true)}
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
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>
                {getInitials(user?.full_name || user?.email?.split('@')[0] || 'User')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Main Grid of Features - Row 1 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="myMV"
            icon="car-outline"
            color="#00BFFF"
            onPress={() => router.push('/vehicles')}
          />
          <FeatureTile
            title="myInsurance"
            icon="shield-checkmark-outline"
            color="#00BFFF"
            onPress={() => router.push('/insurance')}
          />
          <FeatureTile
            title="myFinance"
            customIcon={
              <Text style={{ fontSize: 48, color: '#00BFFF', fontWeight: '200' }}>$</Text>
            }
            color="#00BFFF"
            onPress={() => router.push('/finance')}
          />
        </View>

        {/* Row 2 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="myRoadside"
            icon="car-sport-outline"
            color="#00BFFF"
            onPress={() => router.push('/roadside')}
          />
          <FeatureTile
            title="myService"
            icon="construct-outline"
            color="#00BFFF"
            onPress={() => router.push('/service-booking')}
          />
          <FeatureTile
            title="myMarket"
            icon="cart-outline"
            color="#00BFFF"
            onPress={() => router.push('/marketplace')}
          />
        </View>

        {/* Row 3 */}
        <View style={styles.gridRow}>
          <FeatureTile
            title="Showroom"
            icon="storefront-outline"
            color="#00BFFF"
            onPress={() => router.push('/showroom')}
          />
          <FeatureTile
            title="Promotions"
            icon="pricetag-outline"
            color="#00BFFF"
            onPress={() => router.push('/promotions')}
          />
          <FeatureTile
            title="Logout"
            icon="log-out-outline"
            color="#00BFFF"
            onPress={() => router.push('/auth/login')}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Hamburger Menu */}
      <HamburgerMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
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
    backgroundColor: '#00BFFF',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    marginTop: 10,
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
    padding: 12,
    marginLeft: -8,
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 36,
  },
  brandText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    letterSpacing: 1,
  },
  profileButton: {
    padding: 2,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  initialsText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTileContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
