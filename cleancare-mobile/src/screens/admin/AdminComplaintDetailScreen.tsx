import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';

const STATUS_OPTIONS = ['SUBMITTED', 'PROCESSING', 'SOLVED', 'REJECTED'];

export const AdminComplaintDetailScreen = ({ route, navigation }: any) => {
  const { complaint } = route.params;
  const [status, setStatus] = useState(complaint.status);
  const [updating, setUpdating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    setModalVisible(false); // Close modal immediately
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.patch(`${API_URL}/complaints/${complaint.id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {complaint.images && complaint.images.length > 0 && (
          <Image source={{ uri: complaint.images[0] }} style={styles.image} />
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.category}>{complaint.category}</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
             <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>{status} ✎</Text>
             </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.date}>Submitted: {new Date(complaint.created_at).toLocaleString()}</Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.text}>{complaint.description}</Text>

          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.text}>Lat: {complaint.latitude}, Long: {complaint.longitude}</Text>
          {complaint.address && <Text style={styles.text}>{complaint.address}</Text>}

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
                onPress={() => updateStatus(opt)}
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  category: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  }
});
