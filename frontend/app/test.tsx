import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Test() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Page - If you see this, the app is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#000',
  },
});
