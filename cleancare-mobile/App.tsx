import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import NotificationService from './src/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { NavigationContainerRef } from '@react-navigation/native';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    // Configure notification channel for Android
    NotificationService.configureNotificationChannel();

    // Set up notification listeners
    NotificationService.setupNotificationListeners(
      (notification) => {
        // Handle notification received while app is foregrounded
        console.log('Foreground notification:', notification);
      },
      (response) => {
        // Handle notification tap
        const data = response.notification.request.content.data;
        console.log('Notification tapped, data:', data);

        // Deep link to complaint detail screen if complaint notification
        if (data.type === 'complaint_status_update' && data.complaintId) {
          // Navigate to complaint detail screen
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate('ComplaintDetail', {
              complaintId: data.complaintId
            });
          }
        }
      }
    );

    return () => {
      NotificationService.removeNotificationListeners();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator ref={navigationRef} />
    </SafeAreaProvider>
  );
}
