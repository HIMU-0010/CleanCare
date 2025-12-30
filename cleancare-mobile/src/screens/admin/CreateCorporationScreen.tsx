import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { StorageService } from '../../services/StorageService';

interface ZoneInput {
  name: string;
  wardString: string; // Comma separated, e.g. "1, 3, 5"
}

export const CreateCorporationScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [zones, setZones] = useState<ZoneInput[]>([{ name: '', wardString: '' }]);
  const [loading, setLoading] = useState(false);

  const addZone = () => {
    setZones([...zones, { name: '', wardString: '' }]);
  };

  const removeZone = (index: number) => {
    const newZones = [...zones];
    newZones.splice(index, 1);
    setZones(newZones);
  };

  const updateZone = (index: number, field: keyof ZoneInput, value: string) => {
    const newZones = [...zones];
    newZones[index][field] = value;
    setZones(newZones);
  };

  const handleSubmit = async () => {
    if (!name || !code) {
      Alert.alert('Error', 'Corporation Name and Code are required');
      return;
    }

    // Validate Zones
    const processedZones = [];
    for (const z of zones) {
      if (!z.name.trim()) continue; // Skip empty zones

      const wards = z.wardString
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      processedZones.push({
        name: z.name,
        wards: wards
      });
    }

    if (processedZones.length === 0) {
      Alert.alert('Error', 'Please add at least one valid zone');
      return;
    }

    setLoading(true);
    try {
      const token = await StorageService.getItem('userToken');

      await axios.post(`${API_URL}/locations/bulk`, {
        name,
        code,
        zones: processedZones
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Corporation created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create corporation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New Corporation</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Corporation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Corporation Name (e.g. Dhaka South City Corporation)"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Code (e.g. DSCC)"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>

        {/* Zones & Wards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zones & Wards</Text>
          <Text style={styles.helperText}>
            Enter ward numbers separated by commas (e.g. "1, 2, 3, 4")
          </Text>

          {zones.map((zone, index) => (
            <View key={index} style={styles.zoneCard}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneLabel}>Add Zone</Text>
                {zones.length > 1 && (
                  <TouchableOpacity onPress={() => removeZone(index)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Zone Name (e.g. Zone 1)"
                value={zone.name}
                onChangeText={(text) => updateZone(index, 'name', text)}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ward Names (e.g. 1, 3, 8)"
                value={zone.wardString}
                onChangeText={(text) => updateZone(index, 'wardString', text)}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addZoneBtn} onPress={addZone}>
            <Text style={styles.addZoneText}>+ Add Another Zone</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Create Corporation</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee' },
  backButton: { marginRight: 16, padding: 8 },
  backButtonText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  helperText: { fontSize: 12, color: '#666', marginBottom: 12, fontStyle: 'italic' },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 80, textAlignVertical: 'top' },
  zoneCard: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#eee', elevation: 1 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  zoneLabel: { fontWeight: 'bold', color: '#007bff' },
  removeBtn: { backgroundColor: '#ffebee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  removeBtnText: { color: '#d32f2f', fontSize: 12, fontWeight: 'bold' },
  addZoneBtn: { padding: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#007bff', borderRadius: 8, alignItems: 'center', backgroundColor: '#e3f2fd' },
  addZoneText: { color: '#007bff', fontWeight: 'bold' },
  footer: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#eee' },
  submitBtn: { backgroundColor: '#007bff', padding: 16, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
