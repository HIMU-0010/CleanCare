import React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { TermsAndConditionsScreen } from '../screens/auth/TermsAndConditionsScreen';
import { HomeScreen } from '../screens/citizen/HomeScreen';
import { ProfileScreen } from '../screens/citizen/ProfileScreen';
import { NewComplaintScreen } from '../screens/citizen/NewComplaintScreen';
import { ComplaintListScreen } from '../screens/citizen/ComplaintListScreen';
import { ComplaintDetailScreen } from '../screens/citizen/ComplaintDetailScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { AdminComplaintDetailScreen } from '../screens/admin/AdminComplaintDetailScreen';
import { EmergencyContactsScreen } from '../screens/citizen/EmergencyContactsScreen';
import { GovernmentCalendarScreen } from '../screens/citizen/GovernmentCalendarScreen';
import { PhotoGalleryScreen } from '../screens/citizen/PhotoGalleryScreen';
import { ContentManagementScreen } from '../screens/admin/content/ContentManagementScreen';
import { ManageContactsScreen } from '../screens/admin/content/ManageContactsScreen';
import { ManageCalendarScreen } from '../screens/admin/content/ManageCalendarScreen';
import { ManageGalleryScreen } from '../screens/admin/content/ManageGalleryScreen';
import { AdminManagementScreen } from '../screens/admin/AdminManagementScreen';
import { CreateAdminScreen } from '../screens/admin/CreateAdminScreen';
import { AdminDetailScreen } from '../screens/admin/AdminDetailScreen';
import { ManageCorporationsScreen } from '../screens/admin/ManageCorporationsScreen';
import { CreateCorporationScreen } from '../screens/admin/CreateCorporationScreen';
import { NotificationListScreen } from '../screens/NotificationListScreen';
import NotificationService from '../services/NotificationService';

const Stack = createNativeStackNavigator();

import { COLORS } from '../styles/theme';

export const RootNavigator = React.forwardRef<NavigationContainerRef<any>, {}>((props, ref) => {
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

  React.useImperativeHandle(ref, () => navigationRef.current!);

  React.useEffect(() => {
    // Navigate to complaint details when notification is tapped
    NotificationService.setupNotificationListeners(
      undefined,
      async (response) => {
        const data = response.notification.request.content.data;
        if (data && data.complaintId) {
          let targetScreen = 'ComplaintDetail'; // Default to Citizen view

          if (data.type === 'new_complaint') {
            targetScreen = 'AdminComplaintDetail';
          } else if (data.type === 'complaint_status_update') {
            targetScreen = 'ComplaintDetail';
          } else {
            // Fallback: Check Role
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const profileStr = await AsyncStorage.getItem('userProfile');
              if (profileStr) {
                const profile = JSON.parse(profileStr);
                const isAdmin = profile.role === 'WARD_ADMIN' || profile.role === 'SUPER_ADMIN' || profile.role === 'MASTER_ADMIN';
                if (isAdmin) targetScreen = 'AdminComplaintDetail';
              }
            } catch (e) {
              console.error("Error checking role fallback:", e);
            }
          }

          if (navigationRef.current) {
            navigationRef.current.navigate(targetScreen, {
              complaintId: data.complaintId
            });

            // Mark notification as read
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const axios = require('axios').default;
              const API_URL = require('../config/api').API_URL;
              const token = await AsyncStorage.getItem('userToken');

              // Find and mark the notification as read by complaintId
              await axios.post(`${API_URL}/notifications/mark-by-complaint/${data.complaintId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (e) {
              console.error("Error marking notification as read:", e);
            }
          }
        }
      }
    );

    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} options={{ title: 'Terms & Conditions' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
        <Stack.Screen name="CitizenHome" component={HomeScreen} options={{ title: 'Home' }} />
        <Stack.Screen name="NewComplaint" component={NewComplaintScreen} options={{ title: 'Report Issue' }} />
        <Stack.Screen name="ComplaintList" component={ComplaintListScreen} options={{ title: 'My Complaints' }} />
        <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Details' }} />
        <Stack.Screen name="NotificationList" component={NotificationListScreen} options={{ title: 'Notifications' }} />

        {/* Content Management Screens */}
        <Stack.Screen
          name="EmergencyContacts"
          component={EmergencyContactsScreen}
          options={{
            title: 'Emergency Contacts',
            headerStyle: { backgroundColor: '#FF4D4D' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen name="GovernmentCalendar" component={GovernmentCalendarScreen} options={{ title: 'Government Calendar' }} />
        <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} options={{ title: 'Photo Gallery' }} />

        {/* Admin Screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AdminComplaintDetail" component={AdminComplaintDetailScreen} options={{ title: 'Complaint Detail' }} />
        <Stack.Screen name="AdminManagement" component={AdminManagementScreen} options={{ title: 'Manage Admins' }} />

        <Stack.Screen name="ContentManagement" component={ContentManagementScreen} options={{ title: 'Content Management' }} />
        <Stack.Screen name="ManageContacts" component={ManageContactsScreen} options={{ title: 'Manage Contacts' }} />
        <Stack.Screen name="ManageCalendar" component={ManageCalendarScreen} options={{ title: 'Manage Calendar' }} />
        <Stack.Screen name="ManageGallery" component={ManageGalleryScreen} options={{ title: 'Manage Gallery' }} />

        <Stack.Screen name="ManageCorporations" component={ManageCorporationsScreen} options={{ title: 'Manage Corporations' }} />
        <Stack.Screen name="CreateCorporation" component={CreateCorporationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateAdmin" component={CreateAdminScreen} options={{ title: 'Create New Admin' }} />
        <Stack.Screen name="AdminDetail" component={AdminDetailScreen} options={{ title: 'Admin Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
});
