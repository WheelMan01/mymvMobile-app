import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function HamburgerMenu({ visible, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/auth/login');
  };

  const MenuItem = ({ icon, title, onPress, color = '#fff' }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.menuItemText, { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={color} style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Ionicons name="person-circle" size={60} color="#00BFFF" />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuList}>
            <MenuItem
              icon="car"
              title="My Vehicles"
              onPress={() => handleNavigation('/vehicles')}
            />
            
            <MenuItem
              icon="shield-checkmark"
              title="Insurance"
              onPress={() => handleNavigation('/insurance')}
            />
            
            <MenuItem
              icon="cash"
              title="Finance"
              onPress={() => handleNavigation('/finance')}
            />
            
            <MenuItem
              icon="car-sport"
              title="Roadside Assistance"
              onPress={() => handleNavigation('/roadside')}
            />
            
            <MenuItem
              icon="construct"
              title="Service Booking"
              onPress={() => handleNavigation('/service-booking')}
            />
            
            <MenuItem
              icon="cart"
              title="Marketplace"
              onPress={() => handleNavigation('/marketplace')}
            />
            
            <MenuItem
              icon="storefront"
              title="Showroom"
              onPress={() => handleNavigation('/showroom')}
            />
            
            <MenuItem
              icon="pricetag"
              title="Promotions"
              onPress={() => handleNavigation('/promotions')}
            />
            
            <View style={styles.divider} />
            
            <MenuItem
              icon="settings"
              title="Settings"
              onPress={() => handleNavigation('/profile')}
            />
            
            <MenuItem
              icon="help-circle"
              title="Help & Support"
              onPress={() => {}}
            />
            
            <MenuItem
              icon="log-out"
              title="Logout"
              onPress={handleLogout}
              color="#FF3B30"
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    width: 300,
    backgroundColor: '#1C1C1E',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#000',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    flex: 1,
  },
  chevron: {
    opacity: 0.5,
  },
  divider: {
    height: 8,
    backgroundColor: '#000',
    marginVertical: 10,
  },
});
