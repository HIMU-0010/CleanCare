import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RatingModal } from '../../components/complaint/RatingModal';
import axios from 'axios';
import { API_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaGallery } from '../../components/common/MediaGallery';

import { COLORS } from '../../styles/theme';
import { ResolutionDetailModal } from '../../components/complaint/ResolutionDetailModal';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export const ComplaintDetailScreen = ({ route, navigation }: any) => {
  const { complaint: initialComplaint, complaintId } = route.params;
  const [complaint, setComplaint] = useState(initialComplaint);
  const [loading, setLoading] = useState(!initialComplaint);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Fetch complaint if only ID is provided
  React.useEffect(() => {
    const fetchComplaint = async () => {
      // console.log('Fetching complaint details for ID:', complaintId);
      // console.log('Initial complaint params:', initialComplaint);

      if (!complaint && complaintId) {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const url = `${API_URL}/complaints/${complaintId}`;
          // console.log('Requesting URL:', url);

          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // console.log('Complaint loaded successfully');
          setComplaint(response.data);
        } catch (error: any) {
          console.error('Error fetching complaint:', error);
          if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
          }
          Alert.alert('Error', `Failed to load complaint details: ${error.message}`);
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      } else if (!complaint && !complaintId) {
        Alert.alert('Error', 'No complaint data found');
        navigation.goBack();
      }
    };

    fetchComplaint();
  }, [complaintId, complaint]);

  // Mock Admin Contact Info (In real app, this comes from the assigned admin relation)
  const ADMIN_PHONE = '+8801700000000'; // Replace with real admin number
  const ADMIN_MESSENGER = 'cleanCareAdmin'; // Replace with real admin username

  const openWhatsApp = () => {
    const url = `https://wa.me/${ADMIN_PHONE}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp');
    });
  };

  const openMessenger = () => {
    const url = `https://m.me/${ADMIN_MESSENGER}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Messenger');
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PROCESSING': return 'orange';
      default: return 'gray';
    }
  };

  const handleRate = async (rating: number, review: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.patch(`${API_URL}/complaints/${complaint.id}/rate`,
        { rating, review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Thank you for your feedback!');
      setComplaint((prev: any) => ({ ...prev, rating, review }));
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!complaint) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header Image */}
        {/* Media Gallery */}
        <MediaGallery images={complaint.images} videos={complaint.videos} />

        <View style={styles.content}>
          {/* Status Badge */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(complaint.status) }]}>
                  <Text style={styles.statusText}>{complaint.status}</Text>
                </View>
                <Text style={styles.date}>{new Date(complaint.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>

          {/* Category and Subcategory Chips */}
          <View style={styles.tagsContainer}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{complaint.category}</Text>
            </View>
            {complaint.sub_category ? (
              <View style={styles.tagBadgeOutline}>
                <Text style={styles.tagTextOutline}>{complaint.sub_category}</Text>
              </View>
            ) : null}
          </View>

          {/* UUID Display */}
          <View style={styles.descriptionContainer}>
            <View style={{ paddingHorizontal: 10, paddingBottom: 2 }}>
              <Text style={styles.descriptionLabel}>Complaint ID:</Text>
              <Text style={styles.uuidText} selectable={true}>{complaint.id}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionValue}>{complaint.description}</Text>
          </View>

          {/* Location Hierarchy */}
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Location Details:</Text>
            <Text style={styles.locationValue}>
              {complaint.corporation?.name || 'N/A'} {'>'} {complaint.zone?.name ? `${complaint.zone.name} >` : ''} {complaint.ward?.name || 'N/A'}
            </Text>
            {/* <Text style={styles.locationValue}>
              {complaint.address
                ? complaint.address
                : `Lat: ${complaint.latitude}, Long: ${complaint.longitude}`
              }
            </Text> */}

            {/* Map View */}
            {complaint.latitude && complaint.longitude && (
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: parseFloat(complaint.latitude),
                    longitude: parseFloat(complaint.longitude),
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(complaint.latitude),
                      longitude: parseFloat(complaint.longitude),
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>

          {/* Rating Section */}
          {complaint.status === 'SOLVED' && (
            <View style={styles.RatingContainer}>
              <Text style={styles.RatingLabel}>Your Feedback</Text>
              {complaint.rating ? (
                <View style={styles.ratingDisplay}>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Ionicons
                        key={star}
                        name={star <= complaint.rating ? 'star' : 'star-outline'}
                        size={24}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                  {complaint.review ? <Text style={styles.RatingValue}>{complaint.review}</Text> : null}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() => setRatingModalVisible(true)}
                >
                  <Text style={styles.rateButtonText}>Rate Service</Text>
                </TouchableOpacity>
              )}
            </View>
          )}


          {/* Show Resolution Report Button if Solved or Rejected */}
          {(complaint.status === 'SOLVED' || complaint.status === 'REJECTED') && (
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: complaint.status === 'SOLVED' ? COLORS.primary : COLORS.error }]}
              onPress={() => setReportModalVisible(true)}
            >
              <Ionicons name="document-text" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.reportButtonText}>
                {complaint.status === 'SOLVED' ? 'View Resolution Report' : 'View Rejection Details'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Chat Buttons Section */}
          <View style={styles.RatingContainer}>
            <Text style={styles.RatingLabel}>Chat with Admin</Text>
            <Text style={styles.RatingValue}>Need to clarify something? Start a chat!</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.chatButton, styles.whatsappButton]} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={24} color="white" />
                <Text style={styles.buttonText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.chatButton, styles.messengerButton]} onPress={openMessenger}>
                <Ionicons name="logo-facebook" size={24} color="white" />
                <Text style={styles.buttonText}>Messenger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRate}
      />

      <ResolutionDetailModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        status={complaint.status}
        resolutionImages={complaint.resolutionImages || (complaint.solution_image ? [complaint.solution_image] : [])} // Backwards compatibility if needed
        resolutionVideos={complaint.resolutionVideos}
        resolutionDescription={complaint.resolutionDescription}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },
  tagBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tagBadgeOutline: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tagTextOutline: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    color: 'gray',
    fontSize: 12,
  },
  uuidText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  text: {
    fontSize: 16,
    color: '#444',
  },
  hint: {
    color: 'gray',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  messengerButton: {
    backgroundColor: '#0084FF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  RatingContainer: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  RatingLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  RatingValue: {
    marginBottom: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ratingSection: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  rateButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  rateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ratingDisplay: {
    marginTop: 5,
  },
  reviewText: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#555',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 15,
    elevation: 2,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  descriptionContainer: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  descriptionLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  descriptionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  locationLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  ChatContainer: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  ChatLabel: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  ChatValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
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
});
