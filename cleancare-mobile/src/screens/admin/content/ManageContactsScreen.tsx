import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { StorageService } from '../../../services/StorageService';

export const ManageContactsScreen = ({ navigation }: any) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [phone, setPhone] = useState('');
  const [priority, setPriority] = useState('0');
  const [color, setColor] = useState('#FF4D4D');

  useEffect(() => {
    fetchContacts();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => {
          setTitle('');
          setSubtitle('');
          setPhone('');
          setPriority('0');
          setColor('#FF4D4D');
          setIsEditing(false);
          setModalVisible(true);
        }} style={{ marginRight: 16 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error(error);
      if (contacts.length === 0) setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !phone) {
      Alert.alert('Error', 'Title and Phone are required');
      return;
    }
    try {
      const token = await StorageService.getItem('userToken');
      const payload = {
        title, subtitle, phone, priority: parseInt(priority) || 0, color
      };

      if (isEditing && selectedContactId) {
        await axios.put(`${API_URL}/content/contacts/${selectedContactId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/content/contacts`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setModalVisible(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', isEditing ? 'Failed to update contact' : 'Failed to create contact');
    }
  };

  const openEditModal = (contact: any) => {
    setIsEditing(true);
    setSelectedContactId(contact.id);
    setTitle(contact.title);
    setSubtitle(contact.subtitle || '');
    setPhone(contact.phone);
    setPriority(contact.priority?.toString() || '0');
    setColor(contact.color || '#FF4D4D');
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await StorageService.getItem('userToken');
            await axios.delete(`${API_URL}/content/contacts/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            fetchContacts();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setPhone('');
    setPriority('0');
    setColor('#FF4D4D');
    setIsEditing(false);
    setSelectedContactId(null);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={[styles.iconPreview, { backgroundColor: item.color || '#FF4D4D' }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.phone, { color: item.color || COLORS.primary }]}>📞 {item.phone}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, { backgroundColor: '#4CD964', marginRight: 8 }]}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#ff4d4d' }]}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PRESET_COLORS = [
    '#FF4D4D', // Red
    '#007AFF', // Blue
    '#FF9500', // Orange
    '#4CD964', // Green
    '#5856D6', // Purple
    '#FF3B30', // Error Red
    '#5AC8FA', // Teal
    '#8E8E93', // Gray
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ... Header ... */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ color: 'white', fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Contacts</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View> */}

      {/* ... List ... */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Contact' : 'Add New Contact'}</Text>

            <TextInput style={styles.input} placeholder="Title (e.g. Fire Service)" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Subtitle (Optional)" value={subtitle} onChangeText={setSubtitle} />
            <TextInput style={styles.input} placeholder="Phone (e.g. 999)" value={phone} keyboardType="phone-pad" onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="Priority (Higher shows first)" value={priority} keyboardType="numeric" onChangeText={setPriority} />

            <Text style={styles.label}>Select Color</Text>
            <View style={styles.paletteContainer}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, color === c && styles.selectedColor]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            <View style={styles.colorRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Or enter custom Hex"
                value={color}
                onChangeText={setColor}
              />
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.cancelModalBtn}>
                <Text style={{ color: '#333' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveModalBtn, { backgroundColor: color }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{isEditing ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: COLORS.primary, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: 'white', padding: 8, borderRadius: 8 },
  addBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subtitle: { color: '#666', fontSize: 12 },
  phone: { color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  actionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 20, color: '#999' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelModalBtn: { padding: 14, flex: 1, alignItems: 'center', backgroundColor: '#eee', borderRadius: 8, marginRight: 8 },
  saveModalBtn: { padding: 14, flex: 1, alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 8, marginLeft: 8 },
  colorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  colorPreview: { width: 40, height: 40, borderRadius: 20, marginLeft: 10, borderWidth: 1, borderColor: '#ddd' },
  iconPreview: { width: 40, height: 40, borderRadius: 10, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  paletteContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, justifyContent: 'space-between' },
  colorOption: { width: 32, height: 32, borderRadius: 16, marginBottom: 8, borderWidth: 2, borderColor: 'white' },
  selectedColor: { borderColor: '#333', borderWidth: 2 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
});
