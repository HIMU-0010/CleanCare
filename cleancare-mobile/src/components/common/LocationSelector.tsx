import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // You might need to install this if not present
import axios from 'axios';
import { API_URL } from '../../config/api';
import { COLORS } from '../../styles/theme';

interface LocationSelectorProps {
  onLocationSelected: (wardId: string | null, zoneId: string | null, corporationId: string | null) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationSelected }) => {
  const [corporations, setCorporations] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedCorp, setSelectedCorp] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Fetch Corporations on Mount
  useEffect(() => {
    fetchCorporations();
  }, []);

  const fetchCorporations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/locations/corporations`);
      setCorporations(res.data);
    } catch (error) {
      console.error('Error fetching corporations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCorpChange = async (corpId: string | null) => {
    setSelectedCorp(corpId);
    setSelectedWard(null);
    setWards([]);
    onLocationSelected(null, null, corpId);

    if (corpId) {
      try {
        setLoading(true);
        // Fetch all wards for this corporation directly
        const res = await axios.get(`${API_URL}/locations/corporations/${corpId}/wards`);
        setWards(res.data);
      } catch (error) {
        console.error('Error fetching wards:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleWardChange = (wardId: string) => {
    // Find complete ward object to get zone_id
    const ward = wards.find(w => w.id === wardId);
    if (!ward) return;

    setSelectedWard(wardId);
    // Automatically infer zone from the ward
    onLocationSelected(ward.id, ward.zone_id, selectedCorp);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
      
      <Text style={styles.label}>Corporation</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCorp}
          onValueChange={handleCorpChange}
        >
          <Picker.Item label="Select Corporation" value={null} />
          {corporations.map((corp) => (
            <Picker.Item key={corp.id} label={corp.name} value={corp.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Ward</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedWard || undefined}
          onValueChange={handleWardChange}
          enabled={!!selectedCorp}
        >
          <Picker.Item label="Select Ward" value={null} />
          {wards.map((ward) => (
            <Picker.Item key={ward.id} label={ward.name} value={ward.id} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginLeft: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    overflow: 'hidden',
  },
});

export default LocationSelector;
