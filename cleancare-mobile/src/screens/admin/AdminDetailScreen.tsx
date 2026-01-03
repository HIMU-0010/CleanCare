import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { StorageService } from '../../services/StorageService';
import { COLORS } from '../../styles/theme';

export const AdminDetailScreen = ({ navigation, route }: any) => {
  const { adminId } = route.params;
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // For Super Admin: zone selection
  const [availableZones, setAvailableZones] = useState<any[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);

  // For Ward Admin: ward selection  
  const [availableWards, setAvailableWards] = useState<any[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  const fetchAdminDetails = async () => {
    try {
      const token = await StorageService.getItem('userToken');

      // Get current user's role
      const profileRes = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(profileRes.data.role);

      // Get admin details
      const response = await axios.get(`${API_URL}/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const adminData = response.data;
      setAdmin(adminData);
      setEditName(adminData.name || '');
      setEditPhone(adminData.phone || '');

      // Set current zone/ward selections
      if (adminData.role === 'SUPER_ADMIN') {
        setSelectedZoneIds(adminData.assigned_zones?.map((z: any) => z.id) || []);
        // Load zones for the corporation
        if (adminData.assigned_corporation?.id) {
          await loadZonesForCorporation(adminData.assigned_corporation.id, token as any);
        }
      } else if (adminData.role === 'WARD_ADMIN') {
        setSelectedWardId(adminData.assigned_ward?.id || null);
        // Load wards for the zone
        if (adminData.assigned_ward?.zone?.id) {
          await loadWardsForZone(adminData.assigned_ward.zone.id, token as any);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch admin details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadZonesForCorporation = async (corporationId: string, token: string) => {
    try {
      const res = await axios.get(`${API_URL}/locations/corporations/${corporationId}/zones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableZones(res.data);
    } catch (error) {
      console.error('Failed to load zones:', error);
    }
  };

  const loadWardsForZone = async (zoneId: string, token: string) => {
    try {
      const res = await axios.get(`${API_URL}/locations/zones/${zoneId}/wards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableWards(res.data);
    } catch (error) {
      console.error('Failed to load wards:', error);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    if (!editPhone.trim()) {
      Alert.alert('Error', 'Phone cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const token = await StorageService.getItem('userToken');

      const updateData: any = { name: editName, phone: editPhone };

      if (editPassword) {
        if (editPassword.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        updateData.password = editPassword;
      }

      // Add zone/ward updates based on admin role
      if (admin.role === 'SUPER_ADMIN') {
        updateData.zoneIds = selectedZoneIds;
      } else if (admin.role === 'WARD_ADMIN' && selectedWardId) {
        updateData.wardId = selectedWardId;
      }

      await axios.patch(`${API_URL}/admins/${adminId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh admin data
      await fetchAdminDetails();
      setIsEditing(false);
      setEditPassword('');
      Alert.alert('Success', 'Admin updated successfully');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !admin.is_active;
    const action = newStatus ? 'unblock' : 'block';

    Alert.alert(
      'Confirm',
      `Are you sure you want to ${action} this admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await StorageService.getItem('userToken');

              await axios.patch(`${API_URL}/admins/${adminId}/status`,
                { isActive: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              setAdmin({ ...admin, is_active: newStatus });
              Alert.alert('Success', `Admin ${newStatus ? 'unblocked' : 'blocked'} successfully`);
            } catch (error: any) {
              console.error(error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const toggleZoneSelection = (zoneId: string) => {
    if (selectedZoneIds.includes(zoneId)) {
      setSelectedZoneIds(selectedZoneIds.filter(id => id !== zoneId));
    } else {
      setSelectedZoneIds([...selectedZoneIds, zoneId]);
    }
  };

  const canEdit = userRole === 'MASTER_ADMIN';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!admin) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Admin not found</Text>
      </SafeAreaView>
    );
  }

  // Get corporation name for Ward Admin (through zone)
  const getWardAdminCorporation = () => {
    if (admin.assigned_ward?.zone?.corporation) {
      return admin.assigned_ward.zone.corporation.name;
    }
    return 'N/A';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.roleLabel}>{admin.role?.replace('_', ' ')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: admin.is_active ? 'green' : 'red' }]}>
            <Text style={styles.statusText}>{admin.is_active ? 'Active' : 'Blocked'}</Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter name"
              />
            ) : (
              <Text style={styles.value}>{admin.name || 'N/A'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter phone"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{admin.phone}</Text>
            )}
          </View>

          {isEditing && (
            <View style={styles.field}>
              <Text style={styles.label}>Change Password (Optional)</Text>
              <TextInput
                style={styles.input}
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="Enter new password (min 6 chars)"
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Assignment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Areas</Text>

          {admin.role === 'SUPER_ADMIN' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Corporation</Text>
                <Text style={styles.value}>{admin.assigned_corporation?.name || 'Not Assigned'}</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Managed Zones</Text>
                {isEditing && availableZones.length > 0 ? (
                  <View style={styles.checkboxList}>
                    {availableZones.map((zone: any) => (
                      <TouchableOpacity
                        key={zone.id}
                        style={styles.checkboxItem}
                        onPress={() => toggleZoneSelection(zone.id)}
                      >
                        <View style={[
                          styles.checkbox,
                          selectedZoneIds.includes(zone.id) && styles.checkboxSelected
                        ]}>
                          {selectedZoneIds.includes(zone.id) && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{zone.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  admin.assigned_zones && admin.assigned_zones.length > 0 ? (
                    admin.assigned_zones.map((zone: any) => (
                      <Text key={zone.id} style={styles.listItem}>• {zone.name}</Text>
                    ))
                  ) : (
                    <Text style={styles.value}>No zones assigned</Text>
                  )
                )}
              </View>
            </>
          )}

          {admin.role === 'WARD_ADMIN' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Corporation</Text>
                <Text style={styles.value}>{getWardAdminCorporation()}</Text>
              </View>

              {admin.assigned_ward?.zone && (
                <View style={styles.field}>
                  <Text style={styles.label}>Zone</Text>
                  <Text style={styles.value}>{admin.assigned_ward.zone.name}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Assigned Ward</Text>
                {isEditing && availableWards.length > 0 ? (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedWardId}
                      onValueChange={(value) => setSelectedWardId(value)}
                    >
                      <Picker.Item label="Select Ward" value={null} />
                      {availableWards.map((ward: any) => (
                        <Picker.Item key={ward.id} label={ward.name} value={ward.id} />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <Text style={styles.value}>{admin.assigned_ward?.name || 'Not Assigned'}</Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Actions - Only for Master Admin */}
        {canEdit && (
          <View style={styles.actions}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditName(admin.name || '');
                    setEditPhone(admin.phone || '');
                    setSelectedZoneIds(admin.assigned_zones?.map((z: any) => z.id) || []);
                    setSelectedWardId(admin.assigned_ward?.id || null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, admin.is_active ? styles.blockButton : styles.unblockButton]}
                  onPress={handleToggleStatus}
                >
                  <Text style={styles.buttonText}>{admin.is_active ? 'Block Admin' : 'Unblock Admin'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {!canEdit && (
          <View style={styles.readOnlyNotice}>
            <Text style={styles.readOnlyText}>View Only - You cannot edit this admin's information</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  listItem: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  checkboxList: {
    marginTop: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007bff',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  actions: {
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  blockButton: {
    backgroundColor: '#dc3545',
  },
  unblockButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  readOnlyNotice: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  readOnlyText: {
    color: '#856404',
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
});
