import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Services() {
  const router = useRouter();

  const ServiceCard = ({ title, icon, color, count, route }: any) => (
    <TouchableOpacity 
      style={[styles.serviceCard, { borderLeftColor: color }]}
      onPress={() => router.push(route)}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{title}</Text>
        <Text style={styles.serviceCount}>{count} active</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services</Text>
        <Text style={styles.headerSubtitle}>Manage your vehicle services</Text>
      </View>

      <View style={styles.section}>
        <ServiceCard
          title="Insurance"
          icon="shield-checkmark"
          color="#34C759"
          count="0"
          route="/insurance"
        />
        <ServiceCard
          title="Finance & Loans"
          icon="cash"
          color="#FF9500"
          count="0"
          route="/finance"
        />
        <ServiceCard
          title="Roadside Assistance"
          icon="car-sport"
          color="#FF3B30"
          count="0"
          route="/roadside"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  serviceCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
});