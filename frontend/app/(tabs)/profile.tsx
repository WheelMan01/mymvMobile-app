import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import AppHeader from '../../components/AppHeader';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const ProfileOption = ({ icon, title, onPress, color = '#007AFF' }: any) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="My Profile" />
      
      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userSection}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <ProfileOption
            icon="person-outline"
            title="Edit Profile"
            onPress={() => {}}
          />
          <ProfileOption
            icon="notifications-outline"
            title="Notifications"
            onPress={() => {}}
          />
          <ProfileOption
            icon="lock-closed-outline"
            title="Privacy & Security"
            onPress={() => {}}
          />
          <ProfileOption
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
          />
          <ProfileOption
            icon="information-circle-outline"
            title="About"
            onPress={() => {}}
          />
          <ProfileOption
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F2F2F7',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#1C1C1E',
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  optionsSection: {
    marginTop: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
});