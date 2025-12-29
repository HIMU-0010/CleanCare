import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { COLORS } from '../../styles/theme';
import { FontAwesome6 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const GovernmentCalendarScreen = ({ navigation }: any) => {
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/calendar`);
      if (response.data && response.data.imageUrl) {
        // Construct full URL if relative
        const url = response.data.imageUrl.startsWith('http')
          ? response.data.imageUrl
          : `${API_URL}/${response.data.imageUrl}`;
        setCalendarUrl(url);
      }
    } catch (error) {
      console.error('Failed to fetch calendar', error);
      // Fallback for demo
      // setCalendarUrl('https://example.com/demo-calendar.jpg'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Government Calendar</Text>
      </View> */}

      <ScrollView contentContainerStyle={styles.scrollContent} maximumZoomScale={3} minimumZoomScale={1}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : calendarUrl ? (
          <Image
            source={{ uri: calendarUrl }}
            style={styles.calendarImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No calendar currently available.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: COLORS.primary, // Green
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  calendarImage: {
    width: width - 20,
    height: (width - 20) * 1.4, // Aspect ratio approx A4
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
