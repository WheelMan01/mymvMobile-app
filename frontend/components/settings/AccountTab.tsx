import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'https://vehicle-photo-app.preview.emergentagent.com';

export default function AccountTab() {
  const { user, token } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || user?.mobile || '');

  const handleSaveName = async () => {
    try {
      await axios.patch(
        `${API_URL}/api/users/me`,
        { full_name: name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Name updated successfully');
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update name');
    }
  };

  const handleSaveEmail = async () => {
    try {
      await axios.patch(
        `${API_URL}/api/users/me`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Email updated successfully');
      setIsEditingEmail(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update email');
    }
  };

  const handleSavePhone = async () => {
    try {
      await axios.patch(
        `${API_URL}/api/users/me`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Phone updated successfully');
      setIsEditingPhone(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update phone');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Name Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Full Name</Text>
        {isEditingName ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSaveName}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setName(user?.full_name || '');
                  setIsEditingName(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{user?.full_name || 'Not set'}</Text>
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Email Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Email</Text>
        {isEditingEmail ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSaveEmail}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setEmail(user?.email || '');
                  setIsEditingEmail(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{user?.email || 'Not set'}</Text>
            <TouchableOpacity onPress={() => setIsEditingEmail(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Phone Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Phone</Text>
        {isEditingPhone ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone"
              keyboardType="phone-pad"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={handleSavePhone}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => {
                  setPhone(user?.phone || user?.mobile || '');
                  setIsEditingPhone(false);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{user?.phone || user?.mobile || 'Not set'}</Text>
            <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Member ID (Read-only) */}
      <View style={styles.section}>
        <Text style={styles.label}>Member ID</Text>
        <Text style={styles.value}>{user?.member_id || user?.member_number || 'Not set'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLink: {
    color: '#007AFF',
    fontSize: 16,
  },
  editContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
