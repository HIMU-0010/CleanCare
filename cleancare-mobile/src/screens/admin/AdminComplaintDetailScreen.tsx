import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { MediaGallery } from '../../components/common/MediaGallery';
import { ResolutionDetailModal } from '../../components/complaint/ResolutionDetailModal';
import CustomCamera from '../../components/common/CustomCamera';
import { COLORS } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

const STATUS_OPTIONS = ['PROCESSING', 'SOLVED', 'REJECTED'];

export const AdminComplaintDetailScreen = ({ route, navigation }: any) => {
  const { complaint: initialComplaint, complaintId } = route.params;
  const [complaint, setComplaint] = useState(initialComplaint);
  const [status, setStatus] = useState(initialComplaint?.status);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(!initialComplaint);
  const [modalVisible, setModalVisible] = useState(false);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [resolutionMedia, setResolutionMedia] = useState<any[]>([]);
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('SOLVED');

  // Fetch complaint if only ID is provided
  React.useEffect(() => {
    const fetchComplaint = async () => {
      if (!complaint && complaintId) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const token = await AsyncStorage.getItem('userToken');
          const url = `${API_URL}/complaints/${complaintId}`;

          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComplaint(response.data);
          setStatus(response.data.status);
        } catch (error: any) {
          Alert.alert('Error', `Failed to load complaint details: ${error.message}`);
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      } else if (!complaint && !complaintId) {
        Alert.alert('Error', 'No complaint data found');
        navigation.goBack();
      } else {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [complaintId, complaint]);

  const handleStatusSelection = (newStatus: string) => {
    if (newStatus === 'SOLVED' || newStatus === 'REJECTED') {
      setModalVisible(false);
      setResolutionModalVisible(true);
      setPendingStatus(newStatus);
    } else {
      updateStatus(newStatus);
    }
  };

  const pickMedia = async () => {
    if (resolutionMedia.length >= 5) {
      Alert.alert('Limit Exceeded', 'You can upload a maximum of 5 files.');
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'] as any,
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.7,
      selectionLimit: 5 - resolutionMedia.length,
    });

    if (!result.canceled) {
      const filesToAdd: any[] = [];
      for (const asset of result.assets) {
        if (filesToAdd.length + resolutionMedia.length >= 5) {
          break;
        }
        filesToAdd.push(asset);
      }

      if (filesToAdd.length > 0) {
        setResolutionMedia(prev => [...prev, ...filesToAdd]);
      }
    }
  };

  const handleCameraCapture = (asset: { uri: string, type: 'image' | 'video' }) => {
    setResolutionMedia(prev => [...prev, { uri: asset.uri, type: asset.type }]);
    setIsCameraVisible(false);
  };

  const removeMedia = (index: number) => {
    setResolutionMedia(prev => prev.filter((_, i) => i !== index));
  };

  const submitResolution = async () => {
    // Validation based on status
    if (pendingStatus === 'SOLVED' && resolutionMedia.length === 0) {
      Alert.alert('Media Required', 'Please upload at least one image or video to mark this complaint as solved');
      return;
    }

    if (pendingStatus === 'REJECTED' && !resolutionDescription.trim()) {
      Alert.alert('Description Required', 'Please provide a reason for rejecting this complaint');
      return;
    }

    setUpdating(true);
    setResolutionModalVisible(false);

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');

      const formData = new FormData();
      formData.append('status', pendingStatus);

      // Append all resolution media files (if any)
      resolutionMedia.forEach((item, index) => {
        const uriParts = item.uri.split('.');
        const ext = uriParts.length > 1 ? uriParts[uriParts.length - 1] : (item.type === 'video' ? 'mp4' : 'jpg');
        const mimeType = item.type === 'video' ? `video/${ext}` : `image/${ext}`;

        formData.append('resolutionMedia', {
          uri: item.uri,
          name: `resolution_${index}.${ext}`,
          type: mimeType,
        } as any);
      });

      // Append description if provided
      if (resolutionDescription.trim()) {
        formData.append('resolutionDescription', resolutionDescription.trim());
      }

      await axios.patch(`${API_URL}/complaints/${complaint.id}/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatus(pendingStatus);
      setResolutionMedia([]);
      setResolutionDescription('');
      const statusText = pendingStatus === 'SOLVED' ? 'solved' : 'rejected';
      Alert.alert('Success', `Complaint marked as ${statusText}`);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setModalVisible(false);

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');

      const formData = new FormData();
      formData.append('status', newStatus);

      await axios.patch(`${API_URL}/complaints/${complaint.id}/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatus(newStatus);
      Alert.alert('Success', 'Status updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'SOLVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PROCESSING': return 'orange';
      default: return 'gray';
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
      <ScrollView>
        <MediaGallery images={complaint.images} videos={complaint.videos} />

        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              disabled={status === 'SOLVED' || status === 'REJECTED' || updating}
            >
              <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
                {updating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.statusText}>{status} {(status !== 'SOLVED' && status !== 'REJECTED') ? <Ionicons name="create" size={18} color="white" /> : (status == 'SOLVED') ? <Ionicons name="checkmark-circle-sharp" size={18} color="white" /> : <Ionicons name="close-circle-sharp" size={18} color="white" />}</Text>
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.date}>{new Date(complaint.created_at).toLocaleString()}</Text>
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
            <Text style={styles.locationValue}>Lat: {complaint.latitude}, Long: {complaint.longitude}</Text>
            {complaint.address && <Text style={styles.locationValue}>{complaint.address}</Text>}
          </View>

          {/* Show View Report Button for Admins too if finalized */}
          {(status === 'SOLVED' || status === 'REJECTED') && (
            <TouchableOpacity
              style={[styles.reportButton, { backgroundColor: status === 'SOLVED' ? COLORS.primary : COLORS.error }]}
              onPress={() => setReportModalVisible(true)}
            >
              <Ionicons name="document-text" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.reportButtonText}>
                {status === 'SOLVED' ? 'View Resolution Report' : 'View Rejection Details'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Rating Section */}
          {status === 'SOLVED' && complaint.rating > 0 && (
            <View style={styles.RatingContainer}>
              <Text style={styles.RatingLabel}>Citizen Feedback</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons key={star} name={star <= complaint.rating ? 'star' : 'star-outline'} size={24} color="#FFD700" />
                ))}
              </View>
              {complaint.review ? <Text style={styles.RatingValue}>{complaint.review}</Text> : <Text style={styles.RatingValue}>No review text provided.</Text>}
            </View>
          )}
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Status Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => handleStatusSelection(opt)}
              >
                <Text style={styles.modalOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalOption, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalOptionText, { color: 'red' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Resolution Form Modal */}
      <Modal
        visible={resolutionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setResolutionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {pendingStatus === 'SOLVED' ? 'Mark as Solved' : 'Mark as Rejected'}
              </Text>
              <Text style={styles.resolutionSubtitle}>
                {pendingStatus === 'SOLVED'
                  ? 'Upload proof of resolution (photos/videos)'
                  : 'Provide reason for rejection (description required, media optional)'}
              </Text>

              {/* Media Buttons */}
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity style={styles.flexButton} onPress={pickMedia}>
                  <Text style={styles.buttonTextSmall}>OPEN GALLERY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.flexButton, { backgroundColor: '#555' }]}
                  onPress={() => setIsCameraVisible(true)}
                >
                  <Text style={styles.buttonTextSmall}>OPEN CAMERA</Text>
                </TouchableOpacity>
              </View>

              {/* Media Preview */}
              <ScrollView horizontal style={styles.mediaPreviewContainer} showsHorizontalScrollIndicator={false}>
                {resolutionMedia.map((item, index) => (
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

              {resolutionMedia.length === 0 && (
                <View style={styles.emptyMediaPlaceholder}>
                  <Text style={styles.emptyMediaText}>No media uploaded yet (Max 5 files)</Text>
                </View>
              )}

              {/* Description Input */}
              <Text style={styles.inputLabel}>
                {pendingStatus === 'SOLVED'
                  ? 'Resolution Description (Optional)'
                  : 'Rejection Reason (Required) *'}
              </Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder={pendingStatus === 'SOLVED'
                  ? "Describe how the issue was resolved..."
                  : "Explain why this complaint is being rejected..."}
                placeholderTextColor="#999"
                value={resolutionDescription}
                onChangeText={setResolutionDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              {/* Action Buttons */}
              <View style={styles.resolutionActions}>
                <TouchableOpacity
                  style={[styles.resolutionButton, styles.submitButton]}
                  onPress={submitResolution}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {pendingStatus === 'SOLVED' ? 'Submit Resolution' : 'Submit Rejection'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resolutionButton, styles.cancelResolutionButton]}
                  onPress={() => {
                    setResolutionModalVisible(false);
                    setResolutionMedia([]);
                    setResolutionDescription('');
                  }}
                  disabled={updating}
                >
                  <Text style={styles.cancelResolutionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomCamera
        visible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onMediaCaptured={handleCameraCapture}
      />

      <ResolutionDetailModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        status={complaint.status} // Use current displayed status or complaint status? Better use state status incase it updated
        resolutionImages={complaint.resolutionImages || []}
        resolutionVideos={complaint.resolutionVideos || []}
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
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    elevation: 2,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 10,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  descriptionLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  descriptionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationContainer: {
    marginTop: 10,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  locationLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
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
    fontWeight: 'bold',
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
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  spacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 18,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
    borderBottomWidth: 0,
  },
  resolutionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 15,
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
    fontSize: 11,
  },
  mediaPreviewContainer: {
    flexDirection: 'row',
    maxHeight: 120,
    marginBottom: 15,
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
  emptyMediaPlaceholder: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyMediaText: {
    color: '#999',
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    minHeight: 100,
  },
  resolutionActions: {
    gap: 12,
  },
  resolutionButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelResolutionButton: {
    backgroundColor: COLORS.cancel,
  },
  cancelResolutionText: {
    color: COLORS.cancel_text,
    fontSize: 16,
    fontWeight: '600',
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
});
