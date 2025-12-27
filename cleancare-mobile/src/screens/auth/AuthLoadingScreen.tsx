import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../config/api';

export const AuthLoadingScreen = ({ navigation }: any) => {
    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const userToken = await AsyncStorage.getItem('userToken');
            const userProfileStr = await AsyncStorage.getItem('userProfile');

            if (userToken) {
                // Optional: Verify token with backend
                // For now, we trust the token and let the backend reject requests if invalid (401)
                // Ideally, we should have a /auth/verify endpoint or just fetch profile

                try {
                    // Let's try to fetch profile to verify token is still valid
                    // This also ensures we have fresh user data
                    const response = await axios.get(`${API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });

                    if (response.status === 200) {
                        // Update profile in storage
                        await AsyncStorage.setItem('userProfile', JSON.stringify(response.data));
                        const user = response.data;

                        // Navigate based on role
                        if (user.role === 'WARD_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                            navigation.replace('AdminDashboard');
                        } else {
                            navigation.replace('CitizenHome');
                        }
                        return;
                    }
                } catch (e) {
                    console.log('Token verification failed', e);
                    // If verification fails (e.g. 401), we should probably clear token and go to login
                    await AsyncStorage.removeItem('userToken');
                }
            }

            // If no token or verification failed
            navigation.replace('Login');

        } catch (e) {
            console.log('Auth loading error', e);
            navigation.replace('Login');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <ActivityIndicator size="large" color="#fff" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
