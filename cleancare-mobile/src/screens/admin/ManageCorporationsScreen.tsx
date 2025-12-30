import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { COLORS } from '../../styles/theme';
import { StorageService } from '../../services/StorageService';

interface Ward {
  id: string;
  name: string;
  number: number;
}

interface Zone {
  id: string;
  name: string;
  wards: Ward[];
}

interface Corporation {
  id: string;
  name: string;
  code: string;
  zones: Zone[];
}

export const ManageCorporationsScreen = ({ navigation }: any) => {
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [loading, setLoading] = useState(true);

  // Collapse State
  const [expandedCorps, setExpandedCorps] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'addZone' | 'addWard'>('addZone');
  const [selectedCorpId, setSelectedCorpId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');

  const fetchLocations = async () => {
    try {
      const token = await StorageService.getItem('userToken');

      const corpRes = await axios.get(`${API_URL}/locations/corporations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCorporations(corpRes.data);

      // Auto-expand first corporation
      if (corpRes.data.length > 0) {
        setExpandedCorps(new Set([corpRes.data[0].id]));
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [])
  );

  const handleCreate = async () => {
    try {
      const token = await StorageService.getItem('userToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (modalType === 'addZone') {
        if (!name) return Alert.alert('Error', 'Please enter zone name');
        await axios.post(`${API_URL}/locations/zones`, { name, corporationId: selectedCorpId }, { headers });
      } else if (modalType === 'addWard') {
        if (!name) return Alert.alert('Error', 'Please enter ward name');
        await axios.post(`${API_URL}/locations/wards`, { name, zoneId: selectedZoneId }, { headers });
      }

      setModalVisible(false);
      resetForm();
      fetchLocations();
      Alert.alert('Success', 'Created successfully');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create');
    }
  };

  const resetForm = () => {
    setName('');
  };

  const openCreateCorp = () => {
    navigation.navigate('CreateCorporation');
  };

  const openAddZone = (corpId: string) => {
    setModalType('addZone');
    setSelectedCorpId(corpId);
    resetForm();
    setModalVisible(true);
  };

  const openAddWard = (zoneId: string) => {
    setModalType('addWard');
    setSelectedZoneId(zoneId);
    resetForm();
    setModalVisible(true);
  };

  const toggleCorp = (id: string) => {
    const newSet = new Set(expandedCorps);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCorps(newSet);
  };

  const toggleZone = (id: string) => {
    const newSet = new Set(expandedZones);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedZones(newSet);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Manage Corporations</Text>
          <Text style={styles.subtitle}>{corporations.length} Corporations</Text>
        </View>
      </View> */}

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {corporations.map(corp => (
            <View key={corp.id} style={styles.corpSection}>
              {/* Corp Header */}
              <TouchableOpacity style={styles.corpHeader} onPress={() => toggleCorp(corp.id)}>
                <View style={styles.headerTitle}>
                  <Text style={styles.folderIcon}>{expandedCorps.has(corp.id) ? '📂' : '📁'}</Text>
                  <Text style={styles.corpName}>{corp.name} ({corp.code})</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButtonInfo}
                  onPress={() => openAddZone(corp.id)}
                >
                  <Text style={styles.addButtonText}>+ Zone</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Zones List */}
              {expandedCorps.has(corp.id) && (
                <View style={styles.corpContent}>
                  {corp.zones?.map(zone => (
                    <View key={zone.id} style={styles.zoneSection}>
                      <TouchableOpacity style={styles.zoneHeader} onPress={() => toggleZone(zone.id)}>
                        <View style={styles.headerTitle}>
                          <Text style={styles.folderIcon}>{expandedZones.has(zone.id) ? '📂' : '📁'}</Text>
                          <Text style={styles.zoneName}>{zone.name}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.addButtonSecondary}
                          onPress={() => openAddWard(zone.id)}
                        >
                          <Text style={styles.addButtonText}>+ Ward</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {/* Wards List */}
                      {expandedZones.has(zone.id) && (
                        <View style={styles.zoneContent}>
                          {zone.wards?.map(ward => (
                            <View key={ward.id} style={styles.wardItem}>
                              <Text style={styles.wardIcon}>📍</Text>
                              <Text style={styles.wardName}>{ward.name}</Text>
                            </View>
                          ))}
                          {(!zone.wards || zone.wards.length === 0) && (
                            <Text style={styles.emptyText}>No wards added</Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                  {(!corp.zones || corp.zones.length === 0) && (
                    <Text style={styles.emptyText}>No zones added</Text>
                  )}
                </View>
              )}
            </View>
          ))}
          {corporations.length === 0 && (
            <Text style={styles.emptyPage}>No corporations found. Create one!</Text>
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreateCorp}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'addZone' ? 'Add Zone' : 'Add Ward'}
            </Text>

            {modalType === 'addZone' && (
              <TextInput
                style={styles.input}
                placeholder="Zone Name (e.g. Zone 1)"
                value={name}
                onChangeText={setName}
              />
            )}

            {modalType === 'addWard' && (
              <TextInput
                style={styles.input}
                placeholder="Ward Name (e.g. Ward 1)"
                value={name}
                onChangeText={setName}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={[styles.btnText, { color: 'white' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#666' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  corpSection: { marginBottom: 12, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', elevation: 2 },
  corpHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.primary, alignItems: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  folderIcon: { fontSize: 18, marginRight: 8 },
  corpName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  corpContent: { padding: 8 },
  zoneSection: { marginBottom: 8, marginTop: 4 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#dee2e6' },
  zoneName: { fontSize: 15, fontWeight: '600', color: '#333' },
  zoneContent: { paddingLeft: 24, paddingTop: 8 },
  wardItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  wardIcon: { fontSize: 12, marginRight: 6 },
  wardName: { fontSize: 14, color: '#555' },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabIcon: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  addButtonInfo: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  addButtonSecondary: { backgroundColor: '#6c757d', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  addButtonText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  emptyText: { fontStyle: 'italic', color: '#999', fontSize: 12, marginLeft: 12, marginTop: 4 },
  emptyPage: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { padding: 10, marginRight: 8 },
  createBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 },
  btnText: { fontWeight: 'bold', color: '#666' }
});
