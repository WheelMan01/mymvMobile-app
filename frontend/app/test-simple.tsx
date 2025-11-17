import { View, Text, StyleSheet } from 'react-native';

export default function TestSimple() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ EXPO GO IS WORKING!</Text>
      <Text style={styles.subtext}>If you see this, the connection works.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#0F0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtext: {
    color: '#FFF',
    fontSize: 16,
  },
});
