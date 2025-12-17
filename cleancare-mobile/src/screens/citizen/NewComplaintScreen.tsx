import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, Image, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { API_URL } from '../../config/api';

import LocationSelector from '../../components/common/LocationSelector';

export const NewComplaintScreen = ({ navigation }: any) => {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>('');

  // Custom Location State
  const [isResidence, setIsResidence] = useState(true);
  const [customWardId, setCustomWardId] = useState<string | null>(null);
  const [customZoneId, setCustomZoneId] = useState<string | null>(null);
  const [customCorpId, setCustomCorpId] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }

    setLoading(true);
    try {
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setAddress(`Lat: ${location.coords.latitude}, Long: ${location.coords.longitude}`);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location');
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async () => {
    if (!category || !description || !location) {
      Alert.alert('Error', 'Please fill all fields and capture location');
      return;
    }

    setLoading(true);
    try {
      // Retrieve App JWT from storage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert('Error', 'No access token found. Please login again.');
        return;
      }

      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('latitude', String(location.coords.latitude));
      formData.append('longitude', String(location.coords.longitude));

      if (!isResidence) {
          if (!customWardId || !customCorpId) {
             Alert.alert('Error', 'Please select a valid location (Corporation & Ward)');
             setLoading(false);
             return;
          }
          formData.append('wardId', customWardId);
          formData.append('zoneId', customZoneId || '');
          formData.append('corporationId', customCorpId);
      }
      
      if (image) {
        const uriParts = image.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        // Append image as expected by multer
        formData.append('images', {
          uri: image,
          name: `photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Update with your LOCAL IP address for dev (localhost won't work on device)
      const BACKEND_URL = `${API_URL}/complaints`;

      await axios.post(BACKEND_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`, // Strategy must handle this
        },
      });

      Alert.alert('Success', 'Complaint submitted successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit complaint. Check console/network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Complaint</Text>

        <Text style={styles.label}>Category</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Garbage, Pothole" 
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Describe the issue..." 
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Location</Text>
        <Button title="Get My Location Coordinates" onPress={getLocation} />
        {location && <Text style={styles.locationText}>{address}</Text>}

        <View style={styles.divider} />

        <Text style={styles.label}>Complaint Location</Text>
        <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Is this at your local Area?</Text>
            <TouchableOpacity 
                style={[styles.toggleBtn, isResidence ? styles.toggleActive : null]}
                onPress={() => setIsResidence(!isResidence)}
            >
                <Text style={[styles.toggleText, isResidence ? {color: 'white'} : null]}>
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

        <Text style={styles.label}>Photo</Text>
        <Button title="Pick an image from camera roll" onPress={pickImage} />
        {image && <Image source={{ uri: image }} style={styles.image} />}

        <View style={styles.spacer} />
        <Button title={loading ? "Submitting..." : "Submit Complaint"} onPress={submitComplaint} disabled={loading} color="#007AFF" />
      </ScrollView>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
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
    borderRadius: 5,
  },
  locationText: {
    marginTop: 5,
    color: 'gray',
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
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
});
