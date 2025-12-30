import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { COLORS } from '../../styles/theme';
import { StorageService } from '../../services/StorageService';

interface Ward {
  id: string;
  name: string;
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

interface Admin {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  assigned_corporation?: { id: string; name: string; code: string };
  assigned_ward?: { id: string; name: string };
  assigned_zones?: { id: string; name: string }[];
}

interface HierarchyData {
  [corpId: string]: {
    name: string;
    code: string;
    zones: {
      [zoneId: string]: {
        name: string;
        superAdmins: Admin[];
        wardAdmins: Admin[];
      };
    };
    superAdmins: Admin[]; // Corp-level super admins
  };
}

export const AdminManagementScreen = ({ navigation }: any) => {
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Expanded state
  const [expandedCorps, setExpandedCorps] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [expandedWardLists, setExpandedWardLists] = useState<Set<string>>(new Set()); // To toggle "Wards" list in a Zone

  const fetchData = async () => {
    try {
      const token = await StorageService.getItem('userToken');
      const authHeader = { Authorization: `Bearer ${token}` };

      const [profileRes, locationsRes, adminsRes] = await Promise.all([
        axios.get(`${API_URL}/auth/profile`, { headers: authHeader }),
        axios.get(`${API_URL}/locations/corporations`, { headers: authHeader }),
        axios.get(`${API_URL}/admins`, { headers: authHeader })
      ]);

      const userProfile = profileRes.data;
      setUserRole(userProfile.role);

      // Process Data: Combine Locations with Admins
      let corporations = locationsRes.data;
      const admins = adminsRes.data;

      // Filter Logic for Super Admins
      if (userProfile.role === 'SUPER_ADMIN') {
        // 1. Filter Corporation
        if (userProfile.assigned_corporation) {
          corporations = corporations.filter((c: Corporation) => c.id === userProfile.assigned_corporation.id);
        } else {
          // Fallback: If no corporation assigned, show nothing or all? 
          // Ideally show nothing to prevent unauthorized access.
          corporations = [];
        }

        // 2. Filter Zones within that Corporation
        if (userProfile.assigned_zones && userProfile.assigned_zones.length > 0) {
          const assignedZoneIds = userProfile.assigned_zones.map((z: any) => z.id);
          corporations = corporations.map((c: Corporation) => ({
            ...c,
            zones: c.zones.filter((z: Zone) => assignedZoneIds.includes(z.id))
          }));
        } else {
          // Fallback: If no zones assigned, show no zones
          corporations = corporations.map((c: Corporation) => ({ ...c, zones: [] }));
        }
      }

      const processedData = corporations.map((corp: Corporation) => {
        const zonesWithAdmins = corp.zones?.map((zone: Zone) => {
          // Find Super Admins assigned to THIS Zone
          // Note: Super Admins have `assigned_zones` array
          const zoneSuperAdmins = admins.filter((a: any) =>
            a.role === 'SUPER_ADMIN' && a.assigned_zones?.some((z: any) => z.id === zone.id)
          );

          // Map Wards with their Admins (Multiple per ward)
          const wardsWithAdmins = zone.wards?.map((ward: Ward) => {
            const wardAdmins = admins.filter((a: Admin) =>
              a.role === 'WARD_ADMIN' && a.assigned_ward?.id === ward.id
            );
            return { ...ward, assignedAdmins: wardAdmins };
          }) || [];

          // Sort wards numerically/alphabetically
          wardsWithAdmins.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }));

          return {
            ...zone,
            superAdmins: zoneSuperAdmins,
            wards: wardsWithAdmins
          };
        }) || [];

        return {
          ...corp,
          zones: zonesWithAdmins
        };
      });

      setHierarchyData(processedData);

      // Auto-expand first corporation
      if (processedData.length > 0) {
        setExpandedCorps(new Set([processedData[0].id]));
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const toggleCorp = (corpId: string) => {
    const newSet = new Set(expandedCorps);
    if (newSet.has(corpId)) newSet.delete(corpId);
    else newSet.add(corpId);
    setExpandedCorps(newSet);
  };

  const toggleZone = (zoneId: string) => {
    const newSet = new Set(expandedZones);
    if (newSet.has(zoneId)) newSet.delete(zoneId);
    else newSet.add(zoneId);
    setExpandedZones(newSet);
  };

  const toggleWardList = (zoneId: string) => {
    const newSet = new Set(expandedWardLists);
    if (newSet.has(zoneId)) newSet.delete(zoneId);
    else newSet.add(zoneId);
    setExpandedWardLists(newSet);
  };

  const renderAdminCard = (admin: Admin) => (
    <TouchableOpacity
      key={admin.id}
      style={styles.adminCard}
      onPress={() => navigation.navigate('AdminDetail', { adminId: admin.id })}
    >
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{admin.name}</Text>
        <Text style={styles.adminPhone}>{admin.phone}</Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: admin.is_active ? '#28a745' : '#dc3545' }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.title}>Manage Admins</Text>
        <Text style={styles.subtitle}>Hierarchy View</Text>
      </View> */}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {hierarchyData.map((corp) => (
            <View key={corp.id} style={styles.corpSection}>
              {/* Corporation Header */}
              <TouchableOpacity style={styles.corpHeader} onPress={() => toggleCorp(corp.id)}>
                <View style={styles.corpTitleRow}>
                  <Text style={styles.corpIcon}>{expandedCorps.has(corp.id) ? '📂' : '📁'}</Text>
                  <Text style={styles.corpName}>{corp.name} ({corp.code})</Text>
                </View>
                <Text style={styles.expandIcon}>{expandedCorps.has(corp.id) ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {/* Corporation Content */}
              {expandedCorps.has(corp.id) && (
                <View style={styles.corpContent}>

                  {/* Zones List */}
                  {corp.zones.map((zone: any) => (
                    <View key={zone.id} style={styles.zoneSection}>
                      <TouchableOpacity style={styles.zoneHeader} onPress={() => toggleZone(zone.id)}>
                        <View style={styles.zoneTitleRow}>
                          <Text style={styles.zoneIcon}>{expandedZones.has(zone.id) ? '📂' : '📁'}</Text>
                          <Text style={styles.zoneName}>{zone.name}</Text>
                        </View>
                        <Text style={styles.expandIcon}>{expandedZones.has(zone.id) ? '▼' : '▶'}</Text>
                      </TouchableOpacity>

                      {expandedZones.has(zone.id) && (
                        <View style={styles.zoneContent}>

                          {/* 1. Super Admins Section (Hidden for Super Admins) */}
                          {userRole !== 'SUPER_ADMIN' && (
                            <View style={styles.subSection}>
                              <Text style={styles.subSectionLabel}>Super Admins</Text>
                              {zone.superAdmins.length > 0 ? (
                                zone.superAdmins.map(renderAdminCard)
                              ) : (
                                <Text style={styles.emptyText}>No Super Admins</Text>
                              )}
                            </View>
                          )}

                          {/* 2. Wards Section (Collapsible) */}
                          <View style={styles.subSection}>
                            <TouchableOpacity style={styles.zoneHeader} onPress={() => toggleWardList(zone.id)}>
                              <View style={styles.zoneTitleRow}>
                                <Text style={styles.zoneIcon}>{expandedWardLists.has(zone.id) ? '📂' : '📁'}</Text>
                                <Text style={styles.zoneName}>WARDS</Text>
                              </View>
                              <Text style={styles.expandIcon}>{expandedWardLists.has(zone.id) ? '▼' : '▶'}</Text>
                            </TouchableOpacity>

                            {expandedWardLists.has(zone.id) && (
                              <View style={styles.zoneContent}>
                                {zone.wards.map((ward: any) => (
                                  <View key={ward.id} style={styles.wardContainer}>
                                    <View style={styles.wardHeader}>
                                      <Text style={styles.wardNameTitle}>{ward.name}</Text>
                                    </View>

                                    {/* List of Ward Admins */}
                                    {ward.assignedAdmins.length > 0 ? (
                                      ward.assignedAdmins.map(renderAdminCard)
                                    ) : (
                                      <Text style={styles.unassignedText}>No assigned admins</Text>
                                    )}
                                  </View>
                                ))}
                                {zone.wards.length === 0 && <Text style={styles.emptyText}>No wards in this zone</Text>}
                              </View>
                            )}
                          </View>

                        </View>
                      )}
                    </View>
                  ))}
                  {corp.zones.length === 0 && <Text style={styles.emptyText}>No zones found</Text>}
                </View>
              )}
            </View>
          ))}
          {hierarchyData.length === 0 && <Text style={styles.empty}>No corporations found.</Text>}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {userRole === 'MASTER_ADMIN' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateAdmin')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#666' },
  scrollView: { flex: 1 },
  content: { padding: 12, paddingBottom: 80 },
  corpSection: { marginBottom: 12, backgroundColor: 'white', borderRadius: 8, overflow: 'hidden', elevation: 2 },
  corpHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: COLORS.primary, alignItems: 'center' },
  corpTitleRow: { flexDirection: 'row', alignItems: 'center' },
  corpIcon: { fontSize: 18, marginRight: 10 },
  corpName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  expandIcon: { color: 'white', fontSize: 12 },
  corpContent: { padding: 12 },

  zoneSection: { marginBottom: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 6, overflow: 'hidden' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f8f9fa', alignItems: 'center' },
  zoneTitleRow: { flexDirection: 'row', alignItems: 'center' },
  zoneIcon: { fontSize: 16, marginRight: 8 },
  zoneName: { fontSize: 14, fontWeight: '600', color: '#333' },
  zoneContent: { padding: 10, backgroundColor: '#fff' },

  subSection: { marginBottom: 16 },
  subSectionLabel: { fontSize: 12, color: '#666', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },

  wardListHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  expandIconDark: { fontSize: 10, color: '#666', marginLeft: 6 },
  wardListContent: { paddingLeft: 8 },

  wardContainer: { marginBottom: 12 },
  wardHeader: { marginBottom: 4 },
  wardNameTitle: { fontSize: 14, fontWeight: '600', color: '#333', textDecorationLine: 'underline' },

  adminCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 8, borderRadius: 4, marginBottom: 4, borderWidth: 1, borderColor: '#eee' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 13, fontWeight: '600', color: '#333' },
  adminPhone: { fontSize: 11, color: '#666' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  emptyText: { color: '#999', fontStyle: 'italic', fontSize: 12, marginLeft: 4 },
  unassignedText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginLeft: 4 },

  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
});
