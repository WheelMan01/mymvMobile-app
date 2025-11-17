import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../components/AppHeader';

// Import tab components
import AccountTab from '../../components/settings/AccountTab';
import SecurityTab from '../../components/settings/SecurityTab';
import NotificationsTab from '../../components/settings/NotificationsTab';
import BillingTab from '../../components/settings/BillingTab';
import TransfersTab from '../../components/settings/TransfersTab';

const initialLayout = { width: Dimensions.get('window').width };

export default function SettingsScreen() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'account', title: 'Account' },
    { key: 'security', title: 'Security' },
    { key: 'notifications', title: 'Notifications' },
    { key: 'billing', title: 'Billing' },
    { key: 'transfers', title: 'Transfers' },
  ]);

  const renderScene = SceneMap({
    account: AccountTab,
    security: SecurityTab,
    notifications: NotificationsTab,
    billing: BillingTab,
    transfers: TransfersTab,
  });

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.indicator}
      style={styles.tabBar}
      labelStyle={styles.label}
      activeColor="#00BFFF"
      inactiveColor="#666"
      scrollEnabled
      tabStyle={styles.tab}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Settings" />
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  indicator: {
    backgroundColor: '#00BFFF',
    height: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  tab: {
    width: 'auto',
    minWidth: 100,
  },
});
