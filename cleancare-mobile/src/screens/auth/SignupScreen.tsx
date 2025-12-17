import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/theme';
import LocationSelector from '../../components/common/LocationSelector';
import axios from 'axios';
import { API_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({ navigation, route }: any) => {
  const { phone, uid } = route.params || {}; // Passed from Login
  const [name, setName] = useState('');
  
  const [wardId, setWardId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [corpId, setCorpId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !wardId || !zoneId || !corpId) {
      Alert.alert('Error', 'Please fill all fields and select your location.');
      return;
    }

    try {
      setLoading(true);
      // We need the firebase token again. 
      // In a real app, you'd might store it in context or pass it.
      // For now, we assume the backend validates mainly the phone from the token, 
      // BUT our register endpoint requires the token.
      // If the token expired, we might need to re-auth. 
      // For simplification, let's assume `route.params` has a valid `idToken`.
      const idToken = route.params?.idToken;
      
      if (!idToken) {
          Alert.alert('Error', 'Authentication failed. Please login again.');
          navigation.replace('Login');
          return;
      } 

      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          name,
          role: 'USER',
          wardId,
          zoneId,
          corporationId: corpId,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const { accessToken, user } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('CitizenHome');
    } catch (error: any) {
      console.error('Signup Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Phone: {phone}</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionHeader}>Residence Location</Text>
        <Text style={styles.helperText}>
          Please select where you live. This will be used to route your complaints.
        </Text>

        <LocationSelector
          onLocationSelected={(ward, zone, corp) => {
            setWardId(ward);
            setZoneId(zone);
            setCorpId(corp);
          }}
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
