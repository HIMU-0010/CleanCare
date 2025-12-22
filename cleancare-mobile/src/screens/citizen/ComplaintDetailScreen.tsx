import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RatingModal } from '../../components/complaint/RatingModal';
import axios from 'axios';
import { API_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaGallery } from '../../components/common/MediaGallery';

import { COLORS } from '../../styles/theme';

export const ComplaintDetailScreen = ({ route, navigation }: any) => {
  const { complaint } = route.params;

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

  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const handleRate = async (rating: number, review: string) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        await axios.patch(`${API_URL}/complaints/${complaint.id}/rate`, 
            { rating, review },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Thank you for your feedback!');
        complaint.rating = rating;
        complaint.review = review; 
        // Force update logic might be needed or navigation reload, but simple prop mutation works for immediate feedback if no state re-fetch
    } catch (error) {
        Alert.alert('Error', 'Failed to submit rating');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header Image */}
        {/* Media Gallery */}
        <MediaGallery images={complaint.images} videos={complaint.videos} />

        <View style={styles.content}>
            {/* Status Badge */}
            <View style={styles.headerRow}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(complaint.status) }]}>
                    <Text style={styles.statusText}>{complaint.status}</Text>
                </View>
                <Text style={styles.date}>{new Date(complaint.created_at).toLocaleDateString()}</Text>
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

            {/* Description */}
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{complaint.description}</Text>

            {/* Location (Mocked address logic if raw coords) */}
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.text}>
                {complaint.address 
                    ? complaint.address 
                    : `Lat: ${complaint.latitude}, Long: ${complaint.longitude}`
                }
            </Text>

            {/* Rating Section */}
            {complaint.status === 'SOLVED' && (
              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Your Feedback</Text>
                {complaint.rating ? (
                   <View style={styles.ratingDisplay}>
                      <View style={{flexDirection:'row'}}>
                        {[1, 2, 3, 4, 5].map(star => (
                           <Ionicons 
                              key={star} 
                              name={star <= complaint.rating ? 'star' : 'star-outline'} 
                              size={24} 
                              color="#FFD700" 
                           />
                        ))}
                      </View>
                      {complaint.review ? <Text style={styles.reviewText}>{complaint.review}</Text> : null}
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

            {/* Chat Buttons Section */}
            <Text style={styles.sectionTitle}>Chat with Admin</Text>
            <Text style={styles.hint}>Need to clarify something? Start a chat!</Text>
            
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.chatButton, styles.whatsappButton]} onPress={openWhatsApp}>
                    <Ionicons name="logo-whatsapp" size={24} color="white" />
                    <Text style={styles.buttonText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.chatButton, styles.messengerButton]} onPress={openMessenger}>
                    <Ionicons name="chatbubble" size={24} color="white" /> 
                    <Text style={styles.buttonText}>Messenger</Text>
                </TouchableOpacity>
            </View>
        </View>

      </ScrollView>

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleRate}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  ratingSection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#f9f9f9',
      borderRadius: 10,
  },
  rateButton: {
      backgroundColor: '#007AFF',
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
});
