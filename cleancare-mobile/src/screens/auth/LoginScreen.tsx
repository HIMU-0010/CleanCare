import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, TextInput, Alert, ActivityIndicator, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
// Native Auth: No imports needed here except app
// import { getAuth, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseApp, firebaseConfig } from '../../config/firebase';

// NOTE: You need to add 'expo-firebase-recaptcha' to dependencies
// and ensure you have web credentials for the Firebase project.

// Use Native Firebase Auth
import { getAuth, signInWithPhoneNumber, getIdToken } from '@react-native-firebase/auth';

export const LoginScreen = ({ navigation }: any) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [confirm, setConfirm] = useState<any>(null); // To store valid verification object
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);

    const sendVerification = async () => {
        try {
            setLoading(true);

            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                if (formattedPhone.startsWith('017') && formattedPhone.length === 11) {
                    Alert.alert('Invalid Format', 'Please include country code. For the test number, enter: +10170000000');
                    setLoading(false);
                    return;
                }
                Alert.alert('Invalid Format', 'Phone number must start with + (e.g., +880...)');
                setLoading(false);
                return;
            }

            // signInWithPhoneNumber returns a confirmation object
            const auth = getAuth();
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            setConfirm(confirmation);
            Alert.alert('Verification code has been sent to your phone.');
        } catch (err: any) {
            console.log('Phone Auth Error:', err);
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async () => {
        try {
            if (!confirm) return;
            setLoading(true);

            // confirm.confirm(code) validates the code
            const userCredential = await confirm.confirm(verificationCode);
            // userCredential.user contains the user info.

            // Get ID token
            const idToken = await getIdToken(userCredential.user);

            const { API_URL } = require('../../config/api');
            const axios = require('axios').default;
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

            const response = await axios.post(`${API_URL}/auth/login`, {}, {
                headers: { Authorization: `Bearer ${idToken}` }
            });

            if (!response.data) {
                navigation.navigate('Signup', { phone: userCredential.user.phoneNumber, uid: userCredential.user.uid, idToken: idToken });
                return;
            }

            const { accessToken, user } = response.data;
            if (accessToken) {
                await AsyncStorage.setItem('userToken', accessToken);
                await AsyncStorage.setItem('userProfile', JSON.stringify(user));
                if (user && user.role) {
                    await AsyncStorage.setItem('userRole', user.role);
                }

                // Register push notification token
                try {
                    const NotificationService = require('../../services/NotificationService').default;
                    await NotificationService.registerPushToken();
                } catch (notifError) {
                    console.log('Non-critical: Failed to register push token:', notifError);
                }

                if (user.role === 'WARD_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('CitizenHome');
                }
            }
        } catch (err: any) {
            console.error(err);
            if (err.message.includes('auth/invalid-verification-code')) {
                Alert.alert('Invalid Code', 'The code you entered is incorrect.');
            } else if (err.response && (err.response.status === 404 || err.response.status === 400 || !err.response.data)) {
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
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Welcome To Clean Care</Text>
                </View>

                <View style={styles.formContainer}>
                    {!confirm ? (
                        <>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+880 1XXX-XXXXXX"
                                placeholderTextColor="#999"
                                autoComplete="tel"
                                keyboardType="phone-pad"
                                textContentType="telephoneNumber"
                                onChangeText={setPhoneNumber}
                                value={phoneNumber}
                            />

                            {loading ? (
                                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={sendVerification}>
                                    <Text style={styles.buttonText}>Send Verification Code</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Enter Verification Code</Text>
                            <TextInput
                                style={styles.input}
                                editable={!!confirm}
                                placeholder="123456"
                                placeholderTextColor="#999"
                                onChangeText={setVerificationCode}
                                keyboardType="number-pad"
                                value={verificationCode}
                            />

                            {loading ? (
                                <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.button} onPress={confirmCode}>
                                        <Text style={styles.buttonText}>Confirm Code</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirm(null)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    )}
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
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        borderRadius: 60, // Circular Logo if needed, or just let resizeMode contain handle it
        backgroundColor: '#fff', // White bg for the logo circle if transparent
        borderWidth: 2,
        borderColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    label: {
        marginBottom: 8,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30, // Fully rounded
        fontSize: 16,
        marginBottom: 24,
        color: '#333',
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    button: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#3FA564',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
