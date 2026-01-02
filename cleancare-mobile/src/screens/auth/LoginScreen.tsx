import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/theme';
import { StorageService } from '../../services/StorageService';
import { API_URL } from '../../config/api';
import axios from 'axios';

export const LoginScreen = ({ navigation }: any) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert('Error', 'Please enter both phone number and password');
            return;
        }

        try {
            setLoading(true);

            // Format phone if needed, but assuming user enters full or we handle it.
            // For now, let's send as is or basic clean up.
            const formattedPhone = phone.trim();

            const response = await axios.post(`${API_URL}/auth/login`, {
                phone: formattedPhone,
                password: password
            });

            const { accessToken, user } = response.data;

            if (accessToken) {
                await StorageService.setItem('userToken', accessToken);
                await StorageService.setItem('userProfile', JSON.stringify(user));
                if (user && user.role) {
                    await StorageService.setItem('userRole', user.role);
                }

                // Register push notification token
                try {
                    const NotificationService = require('../../services/NotificationService').default;
                    await NotificationService.registerPushToken();
                } catch (notifError) {
                    console.log('Non-critical: Failed to register push token:', notifError);
                }

                // Reset navigation to Home/Dashboard to prevent going back to login
                navigation.reset({
                    index: 0,
                    routes: [{ name: user.role === 'USER' ? 'CitizenHome' : 'AdminDashboard' }],
                });
            }
        } catch (error: any) {
            console.error('Login Error:', error);
            const message = error.response?.data?.message || 'Login Failed';
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.headerContainer}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.welcomeText}>Welcome Back</Text>
                        <Text style={styles.subText}>Login to continue to Clean Care</Text>
                    </View>

                    <View style={styles.formContainer}>
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
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Info', 'Please contact admin to reset password')}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#3FA564" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text style={styles.signupText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
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
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logo: {
        width: 70,
        height: 70,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#E0F2E9',
    },
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
        color: '#333',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPasswordText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#3FA564',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#E0F2E9',
        fontSize: 16,
    },
    signupText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});
