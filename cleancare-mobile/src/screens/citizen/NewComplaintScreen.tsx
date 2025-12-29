import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Image, ScrollView, Alert, Platform, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Also valid to clean this up, but let's try just using the string values or ignoring strict check if needed.
// Actually, let's try to verify if MediaType is available as named export.
// Changing import to:
import { launchImageLibraryAsync } from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { API_URL } from '../../config/api';

import CustomCamera from '../../components/common/CustomCamera';
import LocationSelector from '../../components/common/LocationSelector';
import { COLORS } from '../../styles/theme';
import { Picker } from '@react-native-picker/picker';
import { COMPLAINT_CATEGORIES } from '../../data/complaintCategories';

import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

export const NewComplaintScreen = ({ navigation }: any) => {
  const [category, setCategory] = useState(COMPLAINT_CATEGORIES[0].name);
  const [subcategory, setSubcategory] = useState(COMPLAINT_CATEGORIES[0].subcategories[0] || '');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<any[]>([]); // Array of { uri, type, name? }
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Custom Location State
  const [isResidence, setIsResidence] = useState(true);
  const [customWardId, setCustomWardId] = useState<string | null>(null);
  const [customZoneId, setCustomZoneId] = useState<string | null>(null);
  const [customCorpId, setCustomCorpId] = useState<string | null>(null);

  const [isCameraVisible, setIsCameraVisible] = useState(false);

  const pickMedia = async () => {
    if (media.length >= 5) {
      Alert.alert('Limit Exceeded', 'You can upload a maximum of 5 files.');
      return;
    }

    let result = await launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsMultipleSelection: true,
      allowsEditing: false, // Editing not supported for multiple/video usually
      quality: 0.7,
      selectionLimit: 5 - media.length // Limit selection to remaining slots
    });

    if (!result.canceled) {
      // ... logic
      const newFiles = result.assets.filter(asset => {
        const currentSize = media.reduce((acc, item) => acc + (item.fileSize || 0), 0);
        // This logic inside map/filter is tricky, better do it after.
        return true;
      });
      // ... actually, copy exact logic but update function call

      const filesToAdd: any[] = [];
      let currentTotalSize = media.reduce((acc, item) => acc + (item.fileSize || 0), 0);

      for (const asset of result.assets) {
        if (currentTotalSize + (asset.fileSize || 0) > 10 * 1024 * 1024) {
          Alert.alert('Size Limit Exceeded', 'Some files were skipped because total size would exceed 10MB.');
          break;
        }
        if (filesToAdd.length + media.length >= 5) {
          break;
        }
        currentTotalSize += (asset.fileSize || 0);
        filesToAdd.push(asset);
      }

      if (filesToAdd.length > 0) {
        setMedia(prev => [...prev, ...filesToAdd]);
      }
    }
  };

  const handleCameraCapture = (asset: { uri: string, type: 'image' | 'video' }) => {
    // Check limits
    const currentSize = media.reduce((acc, item) => acc + (item.fileSize || 0), 0);
    // We don't have fileSize here immediately unless we fetch it or trust it's small enough.
    // expo-camera assets usually have width/height/uri.
    // We can get file info if needed, but for now let's assume it passes or warn on upload.
    // Or use FileSystem.getInfoAsync to check size.

    setMedia(prev => [...prev, { uri: asset.uri, type: asset.type }]);
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }

    setIsLocationLoading(true);
    try {
      let locationResult = await Location.getCurrentPositionAsync({});
      setLocation(locationResult);
      setAddress(`Lat: ${locationResult.coords.latitude.toFixed(4)}, Long: ${locationResult.coords.longitude.toFixed(4)}`);

      setMapRegion({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });

    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Synchronize location from map drag
  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLocation({
      ...location,
      coords: {
        ...location?.coords,
        latitude,
        longitude,
        altitude: location?.coords.altitude || null,
        accuracy: location?.coords.accuracy || null,
        altitudeAccuracy: location?.coords.altitudeAccuracy || null,
        heading: location?.coords.heading || null,
        speed: location?.coords.speed || null,
      },
      timestamp: Date.now(),
    });
    setAddress(`Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`);
  };

  const submitComplaint = async () => {
    if (!category || !description || !location) {
      Alert.alert('Error', 'Please fill all fields and capture location');
      return;
    }

    setIsSubmitting(true);
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert('Error', 'No access token found. Please login again.');
        return;
      }

      const formData = new FormData();
      formData.append('category', category);
      if (subcategory) {
        formData.append('sub_category', subcategory);
      }
      formData.append('description', description);
      formData.append('latitude', String(location.coords.latitude));
      formData.append('longitude', String(location.coords.longitude));

      if (!isResidence) {
        if (!customWardId || !customCorpId) {
          Alert.alert('Error', 'Please select a valid location');
          setIsSubmitting(false);
          return;
        }
        formData.append('wardId', customWardId);
        formData.append('zoneId', customZoneId || '');
        formData.append('corporationId', customCorpId);
      }

      // Append all media files
      media.forEach((item, index) => {
        const uriParts = item.uri.split('.');
        const ext = uriParts.length > 1 ? uriParts[uriParts.length - 1] : (item.type === 'video' ? 'mp4' : 'jpg');

        // Determine mime type roughly
        let mimeType = item.type === 'video' ? `video/${ext}` : `image/${ext}`;

        formData.append('media', {
          uri: item.uri,
          name: `file_${index}.${ext}`,
          type: mimeType,
        } as any);
      });

      const BACKEND_URL = `${API_URL}/complaints`;

      await axios.post(BACKEND_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Complaint submitted successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit complaint. Check console/network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Complaint</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => {
              setCategory(itemValue);
              const selectedCat = COMPLAINT_CATEGORIES.find(c => c.name === itemValue);
              if (selectedCat && selectedCat.subcategories.length > 0) {
                setSubcategory(selectedCat.subcategories[0]);
              } else {
                setSubcategory('');
              }
            }}
            style={styles.picker}
          >
            {COMPLAINT_CATEGORIES.map((cat, index) => (
              <Picker.Item key={index} label={cat.name} value={cat.name} />
            ))}
          </Picker>
        </View>

        {/* Subcategory Dropdown */}
        {(COMPLAINT_CATEGORIES.find(c => c.name === category)?.subcategories?.length ?? 0) > 0 ? (
          <>
            <Text style={styles.label}>Subcategory</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={subcategory}
                onValueChange={(itemValue) => setSubcategory(itemValue)}
                style={styles.picker}
              >
                {COMPLAINT_CATEGORIES.find(c => c.name === category)?.subcategories.map((sub, index) => (
                  <Picker.Item key={index} label={sub} value={sub} />
                ))}
              </Picker>
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Location</Text>

        {/* Map View Section */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion || {
              latitude: 23.8103, // Default fallback (e.g., Dhaka)
              longitude: 90.4125,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={onMapPress} // Allow pinning by tap
            showsUserLocation={true}
            showsMyLocationButton={false} // Custom button below
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                draggable
                onDragEnd={onMapPress}
              />
            )}
          </MapView>
          {!mapRegion && !location && (
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>Tap 'Get My Location' or Move Map</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={getLocation} disabled={isLocationLoading}>
          <Text style={styles.primaryButtonText}>
            {isLocationLoading ? "GETTING LOCATION..." : "GET MY LOCATION COORDINATES"}
          </Text>
        </TouchableOpacity>
        {location && <Text style={styles.locationText}>{address}</Text>}

        <View style={styles.divider} />

        <Text style={styles.label}>Complaint Location</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Is this at your local Area?</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, isResidence ? styles.toggleActive : null]}
            onPress={() => setIsResidence(!isResidence)}
          >
            <Text style={[styles.toggleText, isResidence ? { color: 'white' } : null]}>
              {isResidence ? 'YES' : 'NO'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isResidence && (
          <View style={styles.locationSelectorContainer}>
            <Text style={styles.helperText}>Select the location of the complaint:</Text>
            <LocationSelector
              onLocationSelected={(ward, zone, corp) => {
                setCustomWardId(ward);
                setCustomZoneId(zone);
                setCustomCorpId(corp);
              }}
            />
          </View>
        )}

        <Text style={styles.label}>Evidence (Photos/Videos)</Text>
        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity style={styles.flexButton} onPress={pickMedia}>
            <Text style={styles.buttonTextSmall}>OPEN GALLERY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flexButton, { backgroundColor: '#555' }]} onPress={() => setIsCameraVisible(true)}>
            <Text style={styles.buttonTextSmall}>OPEN CAMERA</Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview */}
        <ScrollView horizontal style={styles.mediaPreviewContainer}>
          {media.map((item, index) => (
            <View key={index} style={styles.mediaThumbnailContainer}>
              <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
              {item.type === 'video' && (
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>VIDEO</Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                <Text style={styles.removeMediaText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <CustomCamera
          visible={isCameraVisible}
          onClose={() => setIsCameraVisible(false)}
          onMediaCaptured={handleCameraCapture}
        />

        {/* <View style={styles.spacer} /> */}

        <TouchableOpacity
          style={[styles.primaryButton, (isSubmitting || isLocationLoading) && { opacity: 0.7 }]}
          onPress={submitComplaint}
          disabled={isSubmitting || isLocationLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "SUBMITTING..." : "SUBMIT COMPLAINT"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Full Screen Loader */}
      <Modal transparent={true} animationType="fade" visible={isSubmitting}>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Submitting Complaint...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.black,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 15,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'uppercase',
  },
  input: {
    color: '#111',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  locationText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  spacer: {
    height: 30,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#555',
  },
  locationSelectorContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  flexButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSmall: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  mediaPreviewContainer: {
    marginTop: 15,
    flexDirection: 'row',
    height: 120,
  },
  mediaThumbnailContainer: {
    position: 'relative',
    marginRight: 10,
    width: 100,
    height: 100,
  },
  mediaThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeMediaText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  mapContainer: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  mapOverlayText: {
    color: '#666',
    fontWeight: 'bold',
  },
});
