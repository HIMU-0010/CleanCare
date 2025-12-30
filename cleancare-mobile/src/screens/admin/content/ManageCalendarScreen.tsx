import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { StorageService } from '../../../services/StorageService';
import * as ImagePicker from 'expo-image-picker';

export const ManageCalendarScreen = ({ navigation }: any) => {
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/calendar`);
      if (response.data && response.data.imageUrl) {
        const url = response.data.imageUrl.startsWith('http')
          ? response.data.imageUrl
          : `${API_URL}/${response.data.imageUrl}`;
        setCalendarUrl(url);
      }
    } catch (error) {
      console.log('No calendar found or error');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: any) => {
    try {
      setUploading(true);
      const token = await StorageService.getItem('userToken');

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: 'calendar.jpg',
      } as any);
      formData.append('year', new Date().getFullYear().toString());

      await axios.post(`${API_URL}/content/calendar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      Alert.alert('Success', 'Calendar uploaded!');
      fetchCalendar();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 12}}>
              <Text style={{color: 'white', fontSize: 24}}>←</Text>
         </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Calendar</Text>
      </View> */}

      <View style={styles.content}>
        <Text style={styles.label}>Current Calendar</Text>

        <View style={styles.previewContainer}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : calendarUrl ? (
            <Image source={{ uri: calendarUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <Text style={styles.noData}>No calendar uploaded</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={pickAndUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload New Calendar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: COLORS.primary, padding: 16, flexDirection: 'row', alignItems: 'center'
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  label: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  previewContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: { width: '100%', height: '100%', borderRadius: 12 },
  noData: { color: '#999' },
  uploadBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 4,
  },
  uploadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
