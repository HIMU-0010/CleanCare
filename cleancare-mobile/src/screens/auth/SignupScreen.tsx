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
  const [address, setAddress] = useState('');
  
  const [wardId, setWardId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [corpId, setCorpId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);

  const isFormValid = name.trim().length > 0 && address.trim().length > 0 && wardId && zoneId && corpId && agreedToTerms;

  const handleSignup = async () => {
    if (!isFormValid) {
      // Should handle via UI disabled state, but safety check
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
          address,
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
      // Consistent naming with Login and HomeScreen
      await AsyncStorage.setItem('userProfile', JSON.stringify(user));
      await AsyncStorage.setItem('userRole', 'USER'); // Ensure role is saved too if needed

      
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
        {/* Title removed since Header "Create Account" covers it? Or Keep it? 
            Screenshot shows only header. Let's keep "Complete Your Profile" as helper text 
            or remove if strictly following screenshot.
            The screenshot shows "Create Account" in Header. 
            I will keep "Complete details" as subtitle context.
        */}
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
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="House No, Road No, Area..."
          value={address}
          onChangeText={setAddress}
          multiline
        />

        {/* TnC Section */}
        <View style={styles.tncContainer}>
            <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <View style={styles.checkboxInner} />}
                </View>
            </TouchableOpacity>
            <Text style={styles.tncText}>
                I agree to the <Text style={{fontWeight: 'bold', color: COLORS.primary}} onPress={() => navigation.navigate('TermsAndConditions')}>Terms & Conditions</Text>
                {/* I agree to the <Text style={{fontWeight: 'bold', color: COLORS.primary}} onPress={() => navigation.navigate('TermsAndConditions')}>Terms & Conditions</Text> and <Text style={{fontWeight: 'bold'}}>Privacy Policy</Text> */}
            </Text>
        </View>

        <TouchableOpacity 
          style={[
              styles.button, 
              (!isFormValid || loading) && styles.disabledButton // Disable style if form invalid logic
          ]} 
          onPress={handleSignup}
          disabled={!isFormValid || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // White background consistent with modern look
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3FA564',
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
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
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
  tncContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
  },
  checkboxContainer: {
      paddingRight: 10,
  },
  checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: '#ccc',
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
  },
  checkboxChecked: {
      borderColor: '#3FA564',
      backgroundColor: '#fff', 
  },
  checkboxInner: {
      width: 14,
      height: 14,
      backgroundColor: '#3FA564',
      borderRadius: 2,
  },
  tncText: {
      fontSize: 14,
      color: '#333',
      flex: 1, // Wrap text
  },
  button: {
    backgroundColor: '#3FA564',
    padding: 16,
    borderRadius: 30, // Fully rounded as per screenshot
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(63, 165, 100, 0.5)', // Faded green for disabled
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;
