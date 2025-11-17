import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '../../hooks/useVehicles';
import AppHeader from '../../components/AppHeader';

export default function Vehicles() {
  const router = useRouter();
  const { vehicles, loading, fetchVehicles, deleteVehicle } = useVehicles();

  const handleDelete = (vehicleId: string, vehicleName: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              Alert.alert('Success', 'Vehicle deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const VehicleCard = ({ vehicle }: any) => (
    <TouchableOpacity 
      style={styles.vehicleCard}
      onPress={() => router.push(`/vehicles/${vehicle.id}`)}
    >
      <View style={styles.vehicleImageContainer}>
        {vehicle.image ? (
          <Image 
            source={{ uri: vehicle.image }} 
            style={styles.vehicleImage}
            resizeMode="cover"
            defaultSource={require('../../assets/images/icon.png')}
            onError={(error) => {
              console.log('Failed to load vehicle image:', vehicle.image, error.nativeEvent);
            }}
          />
        ) : (
          <View style={styles.vehiclePlaceholder}>
            <Ionicons name="car" size={40} color="#8E8E93" />
          </View>
        )}
      </View>
      
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
        <Text style={styles.vehicleYear}>{vehicle.year}</Text>
        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="document-text" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{vehicle.rego}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="barcode" size={14} color="#8E8E93" />
            <Text style={styles.detailText}>{vehicle.vin}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.vehicleActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(vehicle.id, `${vehicle.make} ${vehicle.model}`);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="My Vehicles" />
      {vehicles.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color="#C7C7CC" />
          <Text style={styles.emptyText}>No vehicles added yet</Text>
          <Text style={styles.emptySubtext}>Start by adding your first vehicle</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/vehicles/add')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={({ item }) => <VehicleCard vehicle={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchVehicles} />
          }
          ListHeaderComponent={
            <TouchableOpacity 
              style={styles.addVehicleButton}
              onPress={() => router.push('/vehicles/add')}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addVehicleText}>Add New Vehicle</Text>
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
    backgroundColor: '#1C1C1E',
  },
  list: {
    padding: 16,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  addVehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehiclePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  vehicleDetails: {
    flexDirection: 'column',
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  vehicleActions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
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
    backgroundColor: '#007AFF',
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