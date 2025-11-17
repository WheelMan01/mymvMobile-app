import React, { useState, useEffect, useRef } from 'react';
import AppHeader from '../../components/AppHeader';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllShowroomVehicles,
  getFavoriteVehicles,
  toggleLike,
  toggleFavorite,
  ShowroomVehicle
} from '../../services/showroomApi';
import CommentsModal from '../../components/CommentsModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShowroomScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [vehicles, setVehicles] = useState<ShowroomVehicle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  
  // Animation values for like button
  const likeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadVehicles();
  }, [viewMode]);

  useEffect(() => {
    // Reset image index when vehicle changes
    setCurrentImageIndex(0);
  }, [currentIndex]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = viewMode === 'favorites' 
        ? await getFavoriteVehicles()
        : await getAllShowroomVehicles();
      setVehicles(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (vehicles.length === 0) return;
    
    const vehicle = vehicles[currentIndex];
    
    // Animate heart
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    try {
      const result = await toggleLike(vehicle.id);
      
      // Update local state
      const updatedVehicles = [...vehicles];
      updatedVehicles[currentIndex] = {
        ...vehicle,
        has_liked: result.liked,
        showroom_likes: result.likes_count
      };
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleFavorite = async () => {
    if (vehicles.length === 0) return;
    
    const vehicle = vehicles[currentIndex];

    try {
      const result = await toggleFavorite(vehicle.id);
      
      // Update local state
      const updatedVehicles = [...vehicles];
      updatedVehicles[currentIndex] = {
        ...vehicle,
        is_favorited: result.is_favorited
      };
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleShopTap = () => {
    if (vehicles.length === 0) return;
    
    const vehicle = vehicles[currentIndex];
    if (vehicle.source === 'marketplace' && vehicle.marketplace_listing_id) {
      // Navigate to marketplace detail
      // router.push(`/marketplace/${vehicle.marketplace_listing_id}`);
      console.log('Navigate to marketplace:', vehicle.marketplace_listing_id);
      alert('Marketplace navigation coming soon!');
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SCREEN_HEIGHT);
    if (index !== currentIndex && index >= 0 && index < vehicles.length) {
      setCurrentIndex(index);
    }
  };

  const handleImageScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Showroom</Text>
            <TouchableOpacity
              style={styles.homeButton}
              onPress={() => router.push('/')}
            >
              <Ionicons name="home" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'all' && styles.activeTab]}
              onPress={() => setViewMode('all')}
            >
              <Text style={[styles.tabText, viewMode === 'all' && styles.activeTabText]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'favorites' && styles.activeTab]}
              onPress={() => setViewMode('favorites')}
            >
              <Text style={[styles.tabText, viewMode === 'favorites' && styles.activeTabText]}>
                Favorites
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {viewMode === 'favorites' ? '🔖' : '🚗'}
          </Text>
          <Text style={styles.emptyTitle}>
            {viewMode === 'favorites' ? 'No Favorite Vehicles' : 'No Vehicles in Showroom'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {viewMode === 'favorites' 
              ? 'You haven\'t favorited any vehicles yet'
              : 'Check back later for new vehicles!'}
          </Text>
          {viewMode === 'favorites' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setViewMode('all')}
            >
              <Text style={styles.emptyButtonText}>View All Vehicles</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const currentVehicle = vehicles[currentIndex];

  return (
    <View style={styles.container}>
      <AppHeader title="Showroom" />
      
      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'all' && styles.activeTab]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.tabText, viewMode === 'all' && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'favorites' && styles.activeTab]}
            onPress={() => setViewMode('favorites')}
          >
            <Text style={[styles.tabText, viewMode === 'favorites' && styles.activeTabText]}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle Counter */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {vehicles.length}
        </Text>
      </View>

      {/* Vertical Scrolling Feed */}
      <ScrollView
        ref={scrollViewRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.verticalScroll}
      >
        {vehicles.map((vehicle, index) => {
          const vehicleImages = vehicle.images && vehicle.images.length > 0
            ? vehicle.images
            : [];

          return (
            <View key={vehicle.id} style={styles.vehicleContainer}>
              {/* Horizontal Image Scroll */}
              {vehicleImages.length > 0 ? (
                <>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={index === currentIndex ? handleImageScroll : undefined}
                    scrollEventThrottle={16}
                  >
                    {vehicleImages.map((imageUrl, imgIndex) => (
                      <Image
                        key={imgIndex}
                        source={{ uri: imageUrl }}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>

                  {/* Image Indicators */}
                  {vehicleImages.length > 1 && index === currentIndex && (
                    <View style={styles.imageIndicators}>
                      {vehicleImages.map((_, imgIndex) => (
                        <View
                          key={imgIndex}
                          style={[
                            styles.indicator,
                            imgIndex === currentImageIndex && styles.activeIndicator
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}

              {/* Bottom Overlay with Vehicle Info */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bottomOverlay}
              >
                <Text style={styles.vehicleTitle}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.vehicleSubtitle}>
                  {vehicle.body_type} • {vehicle.state}
                </Text>
                {vehicleImages.length > 1 && index === currentIndex && (
                  <Text style={styles.imageCounter}>
                    Photo {currentImageIndex + 1}/{vehicleImages.length}
                  </Text>
                )}
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Like Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Text style={styles.actionIcon}>
              {currentVehicle.has_liked ? '❤️' : '🤍'}
            </Text>
          </Animated.View>
          <Text style={styles.actionCount}>{currentVehicle.showroom_likes}</Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments(true)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>0</Text>
        </TouchableOpacity>

        {/* Favorite Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleFavorite}>
          <Text style={styles.actionIcon}>
            {currentVehicle.is_favorited ? '🔖' : '📑'}
          </Text>
        </TouchableOpacity>

        {/* Shop Button (only for marketplace) */}
        {currentVehicle.source === 'marketplace' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.shopButton]}
            onPress={handleShopTap}
          >
            <Text style={styles.actionIcon}>🛒</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Comments Modal */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        vehicleId={currentVehicle.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  backButton: {
    padding: 8,
    width: 40
  },
  homeButton: {
    padding: 8,
    width: 40
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center'
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  activeTab: {
    backgroundColor: '#007AFF'
  },
  tabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500'
  },
  activeTabText: {
    fontWeight: 'bold'
  },
  counterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 20
  },
  counterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold'
  },
  verticalScroll: {
    flex: 1
  },
  vehicleContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 120,
    position: 'relative'
  },
  vehicleImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 120
  },
  placeholderContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 120,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderText: {
    color: '#999',
    fontSize: 18
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  activeIndicator: {
    backgroundColor: '#FFF'
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 4
  },
  imageCounter: {
    fontSize: 14,
    color: '#BBB'
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 20
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 12,
    width: 60,
    height: 60,
    justifyContent: 'center'
  },
  shopButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)'
  },
  actionIcon: {
    fontSize: 28
  },
  actionCount: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#BBB',
    textAlign: 'center',
    marginBottom: 24
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
