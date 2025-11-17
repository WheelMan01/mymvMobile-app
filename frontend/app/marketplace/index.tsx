import React, { useState, useEffect } from 'react';
import AppHeader from '../../components/AppHeader';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface MarketplaceListing {
  id: string;
  vehicle_id: string;
  dealer_id?: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer?: number;
  condition: string;
  description: string;
  images: string[];
  contact_name: string;
  contact_phone: string;
  listed_date: string;
}

export default function Marketplace() {
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under20k' | '20k-40k' | 'over40k'>('all');

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Fetch customer listings
      const customerResponse = await api.get('/marketplace/listings');
      const customerListings = customerResponse.data?.data?.listings || [];
      
      // Fetch dealer ads
      const dealerResponse = await api.get('/marketplace/dealer-ads');
      const dealerAds = dealerResponse.data?.ads || [];
      
      // Normalize customer listings
      const normalizedCustomer = customerListings.map((item: any) => ({
        id: item.id,
        vehicle_id: item.vehicle_id,
        title: `${item.vehicle_details?.year || ''} ${item.vehicle_details?.make || ''} ${item.vehicle_details?.model || ''}`.trim(),
        make: item.vehicle_details?.make || '',
        model: item.vehicle_details?.model || '',
        year: item.vehicle_details?.year || 0,
        price: item.price || 0,
        odometer: item.vehicle_details?.odometer || 0,
        condition: item.condition || 'Used',
        description: item.description || '',
        images: item.photos || [],
        contact_name: item.seller_info?.name || '',
        contact_phone: item.seller_info?.phone || '',
        listed_date: item.created_at,
        source: 'customer'
      }));
      
      // Normalize dealer ads
      const normalizedDealer = dealerAds.map((item: any) => ({
        id: item.id,
        dealer_id: item.dealer_id,
        dealer_name: item.dealer_name,
        title: `${item.year || ''} ${item.make || ''} ${item.model || ''}`.trim(),
        make: item.make || '',
        model: item.model || '',
        year: item.year || 0,
        price: item.price || 0,
        odometer: item.odometer || 0,
        condition: 'Dealer',
        description: item.description || '',
        images: item.photos || [],
        contact_name: item.dealer_name || '',
        contact_phone: '',
        listed_date: item.created_at,
        source: 'dealer'
      }));
      
      // Combine and sort by date (newest first)
      const combined = [...normalizedCustomer, ...normalizedDealer];
      combined.sort((a, b) => new Date(b.listed_date).getTime() - new Date(a.listed_date).getTime());
      
      setListings(combined);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.model.toLowerCase().includes(searchQuery.toLowerCase());

    // Price filter
    let matchesPrice = true;
    if (priceFilter === 'under20k') matchesPrice = listing.price < 20000;
    if (priceFilter === '20k-40k') matchesPrice = listing.price >= 20000 && listing.price <= 40000;
    if (priceFilter === 'over40k') matchesPrice = listing.price > 40000;

    return matchesSearch && matchesPrice;
  });

  const ListingCard = ({ listing }: { listing: MarketplaceListing }) => {
    const isDealer = (listing as any).source === 'dealer';
    const dealerName = (listing as any).dealer_name;
    
    return (
      <TouchableOpacity 
        style={styles.listingCard}
        onPress={() => router.push(`/marketplace/${listing.id}?source=${isDealer ? 'dealer' : 'customer'}`)}
      >
        {/* Dealer Badge */}
        {isDealer && (
          <View style={styles.dealerBadgeTop}>
            <Text style={styles.dealerBadgeText}>🏢 Dealer</Text>
          </View>
        )}
        
        <View style={styles.imageContainer}>
          {listing.images && listing.images.length > 0 ? (
            <Image source={{ uri: listing.images[0] }} style={styles.vehicleImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car" size={48} color="#C7C7CC" />
            </View>
          )}
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{listing.condition}</Text>
          </View>
        </View>

        <View style={styles.listingContent}>
          <Text style={styles.listingTitle}>{listing.title}</Text>
          <Text style={styles.listingSubtitle}>{listing.make} {listing.model} • {listing.year}</Text>
          
          {isDealer && dealerName && (
            <Text style={styles.dealerNameText}>{dealerName}</Text>
          )}
          
          <View style={styles.detailsRow}>
            {listing.odometer && (
              <View style={styles.detailItem}>
                <Ionicons name="speedometer-outline" size={14} color="#8E8E93" />
                <Text style={styles.detailText}>{listing.odometer.toLocaleString()} km</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>${listing.price.toLocaleString()}</Text>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Marketplace" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by make, model..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Price Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, priceFilter === 'all' && styles.filterChipActive]}
          onPress={() => setPriceFilter('all')}
        >
          <Text style={[styles.filterChipText, priceFilter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, priceFilter === 'under20k' && styles.filterChipActive]}
          onPress={() => setPriceFilter('under20k')}
        >
          <Text style={[styles.filterChipText, priceFilter === 'under20k' && styles.filterChipTextActive]}>Under $20k</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, priceFilter === '20k-40k' && styles.filterChipActive]}
          onPress={() => setPriceFilter('20k-40k')}
        >
          <Text style={[styles.filterChipText, priceFilter === '20k-40k' && styles.filterChipTextActive]}>$20k-$40k</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, priceFilter === 'over40k' && styles.filterChipActive]}
          onPress={() => setPriceFilter('over40k')}
        >
          <Text style={[styles.filterChipText, priceFilter === 'over40k' && styles.filterChipTextActive]}>Over $40k</Text>
        </TouchableOpacity>
      </View>

      {filteredListings.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No listings found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          renderItem={({ item }) => <ListingCard listing={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchListings} />
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
  sellButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  dealerBadgeTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dealerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dealerNameText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listingContent: {
    padding: 16,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  listingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
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
    textAlign: 'center',
  },
});