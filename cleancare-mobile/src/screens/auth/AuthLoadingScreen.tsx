import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { StorageService } from '../../services/StorageService'; // Import StorageService
import { COLORS } from '../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../config/api';

export const AuthLoadingScreen = ({ navigation }: any) => {
    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            // Check for token in SecureStore via StorageService
            const userToken = await StorageService.getItem('userToken');
            const userProfileStr = await StorageService.getItem('userProfile');

            if (userToken) {
                // Validate token with backend
                try {
                    const response = await axios.get(`${API_URL}/auth/profile`, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });

                    // Update profile if valid
                    await StorageService.setItem('userProfile', JSON.stringify(response.data));

                    const user = response.data;
                    if (user.role === 'WARD_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                        navigation.replace('AdminDashboard');
                    } else {
                        navigation.replace('CitizenHome');
                    }
                } catch (error) {
                    console.log('Token validation failed:', error);
                    // Token invalid/expired
                    await StorageService.removeItem('userToken');
                    navigation.replace('Login');
                }

            } else {
                navigation.replace('Login');
            }
        } catch (e) {
            console.warn(e);
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
