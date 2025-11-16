import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { format } from 'date-fns';

interface ServiceBooking {
  id: string;
  vehicle_id: string;
  dealer_id: string;
  service_type: string;
  booking_date: string;
  status: string;
  notes?: string;
}

export default function ServiceBooking() {
  const router = useRouter();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/service-bookings');
      console.log('Service Bookings API response:', response.data);
      
      // Access nested data structure from live API
      const bookingsData = response.data?.data?.bookings || [];
      console.log('Parsed service bookings:', bookingsData);
      
      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Error fetching service bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return '#34C759';
      case 'Pending': return '#FF9500';
      case 'In Progress': return '#007AFF';
      case 'Completed': return '#8E8E93';
      case 'Cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const BookingCard = ({ booking }: { booking: ServiceBooking }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push(`/service-booking/${booking.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="construct" size={24} color="#FF9500" />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status}
          </Text>
        </View>
      </View>

      <Text style={styles.serviceType}>{booking.service_type}</Text>
      
      <View style={styles.dateSection}>
        <Ionicons name="calendar" size={16} color="#8E8E93" />
        <Text style={styles.dateText}>{format(new Date(booking.booking_date), 'EEE, dd MMM yyyy - hh:mm a')}</Text>
      </View>

      {booking.notes && (
        <View style={styles.notesSection}>
          <Ionicons name="document-text-outline" size={14} color="#8E8E93" />
          <Text style={styles.notesText} numberOfLines={2}>{booking.notes}</Text>
        </View>
      )}

      <View style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      {bookings.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="construct-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No service bookings</Text>
          <Text style={styles.emptySubtext}>Book your first service appointment</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/service-booking/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Book Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={({ item }) => <BookingCard booking={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchBookings} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.addBookingButton}
              onPress={() => router.push('/service-booking/add')}
            >
              <Ionicons name="add-circle" size={24} color="#FF9500" />
              <Text style={styles.addBookingText}>Book New Service</Text>
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
  addBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addBookingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  serviceType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
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