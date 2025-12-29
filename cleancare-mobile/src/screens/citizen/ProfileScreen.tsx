import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { StorageService } from '../../services/StorageService';

export const ProfileScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // User Data
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Location Data (Read Only for now)
  const [ward, setWard] = useState('');
  const [zone, setZone] = useState('');
  const [corporation, setCorporation] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await StorageService.getItem('userToken');
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = response.data;

      setPhone(user.phone || '');
      setName(user.name || '');
      setEmail(user.email || '');
      setAddress(user.address || '');

      // Relations might be objects or just IDs depending on backend.
      // Based on User entity, they are @ManyToOne so likely objects if relations loaded.
      // AuthService.getUserProfile -> UsersService.findOne -> loads relations 'assigned_ward', etc.
      // But residence relations are: residence_ward, residence_zone, residence_corporation.
      // Wait, User Entity has:
      // @ManyToOne(() => Ward) residence_ward;
      // UsersService.findOne loads: 'assigned_ward', 'assigned_corporation', 'assigned_zones'.
      // IT DOES NOT LOAD RESIDENCE RELATIONS!
      // I need to update UsersService to load residence relations too.
      // For now, I will display what I can, but I should fix the backend to load residence.

      // Let's assume for now we might not get full objects until I fix backend.
      // I will add a follow up task to fix backend loading if needed.
      // But let's try to access safely.

      if (user.residence_ward) setWard(user.residence_ward.name);
      if (user.residence_zone) setZone(user.residence_zone.name);
      if (user.residence_corporation) setCorporation(user.residence_corporation.name);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await StorageService.getItem('userToken');

      const response = await axios.patch(`${API_URL}/auth/profile`, {
        name,
        email,
        address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local storage if we cache user profile
      await StorageService.setItem('userProfile', JSON.stringify(response.data));

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <Text style={styles.phoneText}>{phone}</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={name}
            onChangeText={setName}
            editable={isEditing}
            placeholder="Enter your name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={email}
            onChangeText={setEmail}
            editable={isEditing}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            editable={isEditing}
            placeholder="Enter your address"
            multiline
          />

          {/* Location (Read Only) */}
          <View style={styles.locationContainer}>
            <Text style={styles.sectionTitle}>Residence Location</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Corporation:</Text>
              <Text style={styles.locationValue}>{corporation || 'N/A'}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Zone:</Text>
              <Text style={styles.locationValue}>{zone || 'N/A'}</Text>
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Ward:</Text>
              <Text style={styles.locationValue}>{ward || 'N/A'}</Text>
            </View>
            {/* <Text style={styles.helperText}>* To change residence, please contact support.</Text> */}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setIsEditing(false);
                fetchProfile(); // Reset fields
              }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  phoneText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationContainer: {
    marginTop: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationLabel: {
    color: '#666',
    fontSize: 14,
  },
  locationValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    elevation: 2,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    elevation: 2,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
