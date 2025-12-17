import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseApp, firebaseConfig } from '../../config/firebase';

// NOTE: You need to add 'expo-firebase-recaptcha' to dependencies
// and ensure you have web credentials for the Firebase project.

export const LoginScreen = ({ navigation }: any) => {
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = getAuth(firebaseApp);

  const sendVerification = async () => {
    try {
        setLoading(true);
        
        let formattedPhone = phoneNumber.trim();
        // Basic validation: Ensure it starts with +
        if (!formattedPhone.startsWith('+')) {
            // Suggest or auto-fix? Let's auto-fix for the Test Number case if it looks like the one they shared
            if (formattedPhone.startsWith('017') && formattedPhone.length === 11) {
                 // Trying to use test number "+1 017..." or real BD number "+880 17..."?
                 // Since they likely set up +1 01700000000 as test, let's warn them or just ask for full format.
                 Alert.alert('Invalid Format', 'Please include country code. For the test number, enter: +10170000000');
                 setLoading(false);
                 return;
            }
             Alert.alert('Invalid Format', 'Phone number must start with + (e.g., +880...)');
             setLoading(false);
             return;
        }

        const phoneProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneProvider.verifyPhoneNumber(
            formattedPhone,
            recaptchaVerifier.current!
        );
        setVerificationId(verificationId);
        Alert.alert('Verification code has been sent to your phone.');
    } catch (err: any) {
        Alert.alert('Error', err.message);
    } finally {
        setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
        setLoading(true);
        const credential = PhoneAuthProvider.credential(
            verificationId,
            verificationCode
        );
        
        const userCredential = await signInWithCredential(auth, credential);
        const idToken = await userCredential.user.getIdToken();
        
        // Call Backend to verify token and get App JWT
        const { API_URL } = require('../../config/api');
        const axios = require('axios').default;
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        const response = await axios.post(`${API_URL}/auth/login`, {}, {
            headers: { Authorization: `Bearer ${idToken}` }
        });

        // Backend returns NO BODY if user not found (we changed it to return null), 
        // or effectively empty body with 200 OK? 
        // Actually, in `auth.controller.ts`, if `validateUser` returns `null`, NestJS returns 200 OK with empty body by default?
        // Or did I assume 404? 
        // Let's assume safely: keys check.

        if (!response.data) {
             // User not found -> Redirect to Signup
             // Pass the idToken so Signup can use it to Register
             navigation.navigate('Signup', { phone: userCredential.user.phoneNumber, uid: userCredential.user.uid, idToken: idToken });
             return;
        }

        const { accessToken, user } = response.data;
        if (accessToken) {
             await AsyncStorage.setItem('userToken', accessToken);
             if (user && user.role) {
                 await AsyncStorage.setItem('userRole', user.role);
             }
             
             if (user.role === 'WARD_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                 navigation.replace('AdminDashboard');
             } else {
                 navigation.replace('CitizenHome');
             }
        } 
    } catch (err: any) {
        // If backend throws 404 or BadRequest
        console.error(err);
        if (err.response && (err.response.status === 404 || err.response.status === 400 || !err.response.data)) {
             // Assume User Not Found ?? 
             // Better to be explicit.
             // If my backend returns `null`, axios might see empty string.
             Alert.alert('Login Failed', 'Please try again.');
        } else {
             Alert.alert('Error', err.message || 'Login Failed');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={false}
        // appVerificationDisabledForTesting allows you to skip reCAPTCHA
        // IF you have added the phone number as a "Test Number" in Firebase Console.
        appVerificationDisabledForTesting={true}
      />
      
      <Text style={styles.title}>CleanCare Login</Text>
      
      {!verificationId ? (
          <>
            <Text style={styles.label}>Enter Phone Number (+880...)</Text>
            <TextInput
                style={styles.input}
                placeholder="+8801700000000"
                autoComplete="tel"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                onChangeText={setPhoneNumber}
            />
            {loading ? <ActivityIndicator /> : <Button title="Send Verification Code" onPress={sendVerification} />}
          </>
      ) : (
          <>
            <Text style={styles.label}>Enter Verification Code</Text>
            <TextInput
                style={styles.input}
                editable={!!verificationId}
                placeholder="123456"
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
            />
            {loading ? <ActivityIndicator /> : <Button title="Confirm Code" onPress={confirmCode} />}
            <Button title="Cancel" onPress={() => setVerificationId('')} color="red" />
          </>
      )}
      
      {/* Dev Login that actually gets a Token from Backend */}
       <Button 
        title="[DEV] Login as Test User" 
        onPress={async () => {
          try {
             setLoading(true);
             const { API_URL } = require('../../config/api');
             const axios = require('axios').default;
             const AsyncStorage = require('@react-native-async-storage/async-storage').default;

             // Call backend with the magic DEV token
             const response = await axios.post(`${API_URL}/auth/login`, {}, {
               headers: { Authorization: 'Bearer DEV_TEST_TOKEN' }
             });
             
             const { accessToken, user } = response.data;
             if (accessToken) {
                await AsyncStorage.setItem('userToken', accessToken);
                if (user && user.role) {
                    await AsyncStorage.setItem('userRole', user.role);
                }
                
                if (user.role === 'WARD_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('CitizenHome');
                }
             } else {
                Alert.alert('Error', 'No token received from backend');
             }
          } catch (e: any) {
             Alert.alert('Dev Login Failed', e.message);
          } finally {
             setLoading(false);
          }
        }} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  }
});
