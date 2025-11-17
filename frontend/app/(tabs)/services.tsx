import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

export default function Services() {
  const router = useRouter();

  const ServiceCard = ({ title, description, icon, color, route }: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => route && router.push(route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={40} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Services" />
      
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Available Services</Text>

        <ServiceCard
          title="Service Booking"
          description="Book vehicle maintenance and repairs"
          icon="construct"
          color="#00BFFF"
          route="/service-booking"
        />

        <ServiceCard
          title="Insurance"
          description="Manage your insurance policies"
          icon="shield-checkmark"
          color="#34C759"
          route="/insurance"
        />

        <ServiceCard
          title="Finance"
          description="View loans and financing options"
          icon="cash"
          color="#FF9500"
          route="/finance"
        />

        <ServiceCard
          title="Roadside Assistance"
          description="24/7 emergency roadside support"
          icon="car-sport"
          color="#FF3B30"
          route="/roadside"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
});