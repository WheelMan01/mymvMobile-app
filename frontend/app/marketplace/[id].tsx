import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Linking, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

interface ListingDetail {
  id: string;
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
  contact_email?: string;
  listed_date: string;
  features?: string[];
}

export default function MarketplaceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/marketplace-listings/${id}`);
      setListing(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleCall = () => {
    if (listing?.contact_phone) {
      Alert.alert(
        'Call Dealer',
        `Call ${listing.contact_name} at ${listing.contact_phone}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${listing.contact_phone}`) },
        ]
      );
    }
  };

  const handleEmail = () => {
    if (listing?.contact_email) {
      Linking.openURL(`mailto:${listing.contact_email}?subject=Inquiry about ${listing.title}`);
    }
  };

  const handleTestDrive = () => {
    Alert.alert(
      'Request Test Drive',
      `Would you like to request a test drive for this ${listing?.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: () => {
            Alert.alert('Success', 'Test drive request sent! The dealer will contact you soon.');
          }
        },
      ]
    );
  };

  if (loading || !listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {listing.images && listing.images.length > 0 ? (
            <>
              <Image source={{ uri: listing.images[currentImageIndex] }} style={styles.mainImage} />
              {listing.images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {listing.images.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.indicator, 
                        currentImageIndex === index && styles.indicatorActive
                      ]} 
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="car" size={80} color="#C7C7CC" />
            </View>
          )}
        </View>

        {/* Title and Price */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContent}>
              <Text style={styles.title}>{listing.title}</Text>
              <Text style={styles.subtitle}>{listing.make} {listing.model} • {listing.year}</Text>
            </View>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{listing.condition}</Text>
            </View>
          </View>
          <Text style={styles.price}>${listing.price.toLocaleString()}</Text>
        </View>

        {/* Key Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Year</Text>
                <Text style={styles.detailValue}>{listing.year}</Text>
              </View>
            </View>
            {listing.odometer && (
              <View style={styles.detailItem}>
                <Ionicons name="speedometer-outline" size={20} color="#8E8E93" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Odometer</Text>
                  <Text style={styles.detailValue}>{listing.odometer.toLocaleString()} km</Text>
                </View>
              </View>
            )}
            <View style={styles.detailItem}>
              <Ionicons name="car-outline" size={20} color="#8E8E93" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>{listing.condition}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#8E8E93" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Listed</Text>
                <Text style={styles.detailValue}>{format(new Date(listing.listed_date), 'dd MMM yyyy')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Features */}
        {listing.features && listing.features.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {listing.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Seller */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Contact Seller</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerIconContainer}>
              <Ionicons name="person" size={24} color="#007AFF" />
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{listing.contact_name}</Text>
              <Text style={styles.sellerPhone}>{listing.contact_phone}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testDriveButton} onPress={handleTestDrive}>
          <Ionicons name="car" size={20} color="#fff" />
          <Text style={styles.testDriveButtonText}>Request Test Drive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imageGallery: {
    width: width,
    height: 300,
    backgroundColor: '#000',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  conditionBadge: {
    backgroundColor: '#34C75920',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  detailTextContainer: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  featuresCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  contactCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 16,
    color: '#8E8E93',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  testDriveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
  },
  testDriveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});