import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Keyboard, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/theme';
import LocationSelector from '../../components/common/LocationSelector';
import axios from 'axios';
import { StorageService } from '../../services/StorageService';
import { API_URL } from '../../config/api';

const SignupScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const [wardId, setWardId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [corpId, setCorpId] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isFormValid = phone.trim().length > 0 &&
    password.trim().length >= 6 &&
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    wardId && zoneId && corpId && agreedToTerms;

  const handleSignup = async () => {
    if (!isFormValid) {
      if (password.trim().length < 6) {
        Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
        return;
      }
      Alert.alert('Missing Fields', 'Please fill all fields and agree to terms.');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          phone,
          password,
          name,
          address,
          role: 'USER',
          wardId,
          zoneId,
          corporationId: corpId,
        }
      );

      const { accessToken, user } = response.data;

      // Save session
      await StorageService.setItem('userToken', accessToken);
      await StorageService.setItem('userProfile', JSON.stringify(user));
      await StorageService.setItem('userRole', 'USER');

      // Register push notification token
      try {
        const NotificationService = require('../../services/NotificationService').default;
        await NotificationService.registerPushToken();
      } catch (notifError) {
        console.log('Non-critical: Failed to register push token:', notifError);
      }

      Alert.alert('Success', 'Account created successfully!');
      // Reset navigation
      navigation.reset({
        index: 0,
        routes: [{ name: 'CitizenHome' }],
      });

    } catch (error: any) {
      console.error('Signup Error:', error.response?.data || error.message);
      const msg = error.response?.data?.message || 'Failed to create account. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { marginBottom: keyboardOffset }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>Sign up to get started</Text>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+880 1XXX-XXXXXX"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Min 6 characters"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionHeader}>Residence Location</Text>
        <Text style={styles.helperText}>
          Select where you live to route your complaints.
        </Text>

        {/* Location Selector might need style tweaks for green bg, or we wrap it in a white container? 
            Let's wrap it in a white card.
        */}
        <View style={styles.card}>
          <LocationSelector
            onLocationSelected={(ward, zone, corp) => {
              setWardId(ward);
              setZoneId(zone);
              setCorpId(corp);
            }}
          />
        </View>

        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="House No, Road No, Area..."
          placeholderTextColor="#999"
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
            I have read and agree to the <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }} onPress={() => navigation.navigate('TermsAndConditions')}>Terms & Conditions</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!isFormValid || loading) && styles.disabledButton
          ]}
          onPress={handleSignup}
          disabled={!isFormValid || loading}
        >
          {loading ? <ActivityIndicator color="#3FA564" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3FA564', // Green Theme
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0F2E9',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#fff',
  },
  helperText: {
    fontSize: 14,
    color: '#E0F2E9',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  tncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  checkboxContainer: {
    paddingRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
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
    color: '#fff',
    flex: 1,
  },
  button: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 0,
  },
  buttonText: {
    color: '#3FA564',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#E0F2E9',
    fontSize: 16,
  },
  loginLink: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;
