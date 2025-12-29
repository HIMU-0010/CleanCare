import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Sidebar, HamburgerButton } from '../../components/common/Sidebar';
import { NotificationBell } from '../../components/common/NotificationBell';

export const HomeScreen = ({ navigation }: any) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NotificationBell onPress={() => navigation.navigate('NotificationList')} />
          <HamburgerButton
            onPress={() => setSidebarOpen(prev => !prev)}
          />
        </View>
      ),
    });
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const axios = require('axios').default;
      const { API_URL } = require('../../config/api');

      const token = await AsyncStorage.getItem('userToken');
      // If token is missing, might redirect to login, but let's just try to load from storage first
      // or fetch if possible.
      if (token) {
        try {
          // Fetch fresh profile
          const profileRes = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const profile = profileRes.data;
          setUserName(profile.name || '');
          // Update local storage
          await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
          return;
        } catch (e) {
          console.log('Failed to fetch profile, using cached', e);
        }
      }

      // Fallback to cached
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        const parsed = JSON.parse(profile);
        setUserName(parsed.name || '');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleLogout = async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const sidebarItems = [
    {
      label: 'My Complaints',
      icon: 'list-check',
      onPress: () => navigation.navigate('ComplaintList'),
    },
    {
      label: 'My Profile',
      icon: 'user',
      onPress: () => navigation.navigate('Profile'),
    },
    {
      label: 'Emergency Contacts',
      icon: 'phone',
      onPress: () => navigation.navigate('EmergencyContacts'),
    },
    {
      label: 'Government Calendar',
      icon: 'calendar-days',
      onPress: () => navigation.navigate('GovernmentCalendar'),
    },
    {
      label: 'Photo Gallery',
      icon: 'images',
      onPress: () => navigation.navigate('PhotoGallery'),
    },
    {
      label: 'Logout',
      icon: 'right-from-bracket',
      onPress: handleLogout,
      color: '#ff6b6b',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      {/* <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>CleanCare</Text>
          <Text style={styles.subtitle}>Keep your city clean</Text>
        </View>
        <HamburgerButton onPress={() => setSidebarOpen(true)} />
      </View> */}

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome{userName ? `, ${userName}` : ''}!</Text>
          <Text style={styles.welcomeSubtext}>
            Help us keep your neighborhood clean by reporting issues you encounter.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('NewComplaint')}
        >
          {/* <Text style={styles.reportIcon}>📸</Text> */}
          <Text style={styles.reportButtonText}>Report New Issue</Text>
          <Text style={styles.reportButtonSubtext}>Take a photo and submit a complaint</Text>
        </TouchableOpacity>
      </View>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={sidebarItems}
        userName={userName}
        userRole="Citizen"
      />
    </SafeAreaView>
  );
};

import { COLORS } from '../../styles/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007bff',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reportButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    // Add shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
});
