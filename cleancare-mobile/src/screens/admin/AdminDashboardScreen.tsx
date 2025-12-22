import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { Sidebar, HamburgerButton } from '../../components/common/Sidebar';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COMPLAINT_CATEGORIES } from '../../data/complaintCategories';

// Component for video thumbnail
const VideoThumbnail = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.muted = true;
    player.loop = true;
    // player.pause(); // Start paused
  });

  return (
    <View style={styles.videoContainer}>
        <VideoView 
            player={player}
            style={styles.image}
            contentFit="cover"
            nativeControls={false} // Hide controls for thumbnail
        />
        <View style={styles.searchIconOverlay}>
            <Ionicons name="play-circle" size={40} color="white" />
        </View>
    </View>
  );
};

export const AdminDashboardScreen = ({ navigation }: any) => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [corporations, setCorporations] = useState<any[]>([]);
  const [selectedCorpId, setSelectedCorpId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // For Super Admin - their assigned zones
  const [assignedZones, setAssignedZones] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const profileRes = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = profileRes.data;
      setUserRole(profile.role);
      setUserProfile(profile);

      if (profile.role === 'MASTER_ADMIN') {
        const corpRes = await axios.get(`${API_URL}/locations/corporations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCorporations(corpRes.data);
      }

      if (profile.role === 'SUPER_ADMIN') {
        setAssignedZones(profile.assigned_zones || []);
      }

      await fetchComplaints(token, profile.role);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async (token?: string, role?: string) => {
    try {
      if (!token) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        token = await AsyncStorage.getItem('userToken');
      }
      if (!role) role = userRole;

      let url = `${API_URL}/complaints/hierarchy?`;
      if (selectedCorpId) url += `corporationId=${selectedCorpId}&`;
      if (selectedZoneId) url += `zoneId=${selectedZoneId}&`;
      if (selectedWardId) url += `wardId=${selectedWardId}&`;
      if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedSubcategory) url += `subCategory=${encodeURIComponent(selectedSubcategory)}&`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!loading && userRole) {
      fetchComplaints();
    }
  }, [selectedCorpId, selectedZoneId, selectedWardId, selectedCategory, selectedSubcategory]);

  const handleLogout = async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  const getSidebarItems = () => {
    const items = [];
    
    if (userRole === 'MASTER_ADMIN' || userRole === 'SUPER_ADMIN') {
      items.push({
        label: 'Manage Admins',
        // icon: '👥',
        onPress: () => navigation.navigate('AdminManagement'),
      });
    }
    
    items.push({
      label: 'Logout',
      // icon: '🚪',
      onPress: handleLogout,
      color: '#ff6b6b',
    });
    
    return items;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      case 'PROCESSING': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getZonesForCorp = () => {
    const corp = corporations.find(c => c.id === selectedCorpId);
    return corp?.zones || [];
  };

  const getWardsForZone = () => {
    if (userRole === 'SUPER_ADMIN') {
      const zone = assignedZones.find(z => z.id === selectedZoneId);
      return zone?.wards || [];
    }
    const corp = corporations.find(c => c.id === selectedCorpId);
    const zone = corp?.zones?.find((z: any) => z.id === selectedZoneId);
    return zone?.wards || [];
  };

  const renderCategoryFilters = () => (
    <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter By Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
                style={[styles.filterChip, !selectedCategory && styles.filterChipSelected]}
                onPress={() => { setSelectedCategory(''); setSelectedSubcategory(''); }}
            >
                <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextSelected]}>All</Text>
            </TouchableOpacity>
            {COMPLAINT_CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.filterChip, selectedCategory === cat.name && styles.filterChipSelected]}
                    onPress={() => { setSelectedCategory(cat.name); setSelectedSubcategory(''); }}
                >
                    <Text style={[styles.filterChipText, selectedCategory === cat.name && styles.filterChipTextSelected]}>
                        {cat.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>

        {selectedCategory && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                 <TouchableOpacity
                    style={[styles.filterChip, !selectedSubcategory && styles.filterChipSelected]}
                    onPress={() => setSelectedSubcategory('')}
                >
                    <Text style={[styles.filterChipText, !selectedSubcategory && styles.filterChipTextSelected]}>All Subcategories</Text>
                </TouchableOpacity>
                {COMPLAINT_CATEGORIES.find(c => c.name === selectedCategory)?.subcategories.map((sub, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.filterChip, selectedSubcategory === sub && styles.filterChipSelected]}
                        onPress={() => setSelectedSubcategory(sub)}
                    >
                        <Text style={[styles.filterChipText, selectedSubcategory === sub && styles.filterChipTextSelected]}>
                            {sub}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        )}
    </View>
  );

  const renderFilters = () => {
    if (userRole === 'MASTER_ADMIN') {
      return (
        <View>
          {renderCategoryFilters()}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Filter By Location:</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedCorpId && styles.filterChipSelected]}
              onPress={() => { setSelectedCorpId(''); setSelectedZoneId(''); setSelectedWardId(''); }}
            >
              <Text style={[styles.filterChipText, !selectedCorpId && styles.filterChipTextSelected]}>All</Text>
            </TouchableOpacity>
            {corporations.map(corp => (
              <TouchableOpacity
                key={corp.id}
                style={[styles.filterChip, selectedCorpId === corp.id && styles.filterChipSelected]}
                onPress={() => { setSelectedCorpId(corp.id); setSelectedZoneId(''); setSelectedWardId(''); }}
              >
                <Text style={[styles.filterChipText, selectedCorpId === corp.id && styles.filterChipTextSelected]}>
                  {corp.code || corp.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedCorpId && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedZoneId && styles.filterChipSelected]}
                onPress={() => { setSelectedZoneId(''); setSelectedWardId(''); }}
              >
                <Text style={[styles.filterChipText, !selectedZoneId && styles.filterChipTextSelected]}>All Zones</Text>
              </TouchableOpacity>
              {getZonesForCorp().map((zone: any) => (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.filterChip, selectedZoneId === zone.id && styles.filterChipSelected]}
                  onPress={() => { setSelectedZoneId(zone.id); setSelectedWardId(''); }}
                >
                  <Text style={[styles.filterChipText, selectedZoneId === zone.id && styles.filterChipTextSelected]}>
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedZoneId && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedWardId && styles.filterChipSelected]}
                onPress={() => setSelectedWardId('')}
              >
                <Text style={[styles.filterChipText, !selectedWardId && styles.filterChipTextSelected]}>All Wards</Text>
              </TouchableOpacity>
              {getWardsForZone().map((ward: any) => (
                <TouchableOpacity
                  key={ward.id}
                  style={[styles.filterChip, selectedWardId === ward.id && styles.filterChipSelected]}
                  onPress={() => setSelectedWardId(ward.id)}
                >
                  <Text style={[styles.filterChipText, selectedWardId === ward.id && styles.filterChipTextSelected]}>
                    {ward.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        </View>
      );
    }

    if (userRole === 'SUPER_ADMIN') {
      return (
        <View>
          {renderCategoryFilters()}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Your Zones:</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedZoneId && styles.filterChipSelected]}
              onPress={() => { setSelectedZoneId(''); setSelectedWardId(''); }}
            >
              <Text style={[styles.filterChipText, !selectedZoneId && styles.filterChipTextSelected]}>All Zones</Text>
            </TouchableOpacity>
            {assignedZones.map(zone => (
              <TouchableOpacity
                key={zone.id}
                style={[styles.filterChip, selectedZoneId === zone.id && styles.filterChipSelected]}
                onPress={() => { setSelectedZoneId(zone.id); setSelectedWardId(''); }}
              >
                <Text style={[styles.filterChipText, selectedZoneId === zone.id && styles.filterChipTextSelected]}>
                  {zone.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedZoneId && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedWardId && styles.filterChipSelected]}
                onPress={() => setSelectedWardId('')}
              >
                <Text style={[styles.filterChipText, !selectedWardId && styles.filterChipTextSelected]}>All Wards</Text>
              </TouchableOpacity>
              {getWardsForZone().map((ward: any) => (
                <TouchableOpacity
                  key={ward.id}
                  style={[styles.filterChip, selectedWardId === ward.id && styles.filterChipSelected]}
                  onPress={() => setSelectedWardId(ward.id)}
                >
                  <Text style={[styles.filterChipText, selectedWardId === ward.id && styles.filterChipTextSelected]}>
                    {ward.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('AdminComplaintDetail', { complaint: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.location}>
        {item.corporation?.code || item.corporation?.name || 'N/A'} → {item.zone?.name || 'N/A'} → {item.ward?.name || 'N/A'}
      </Text>
      
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      <Text numberOfLines={2} style={styles.description}>{item.description}</Text>
      
      {item.images && item.images.length > 0 ? (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      ) : item.videos && item.videos.length > 0 ? (
        <VideoThumbnail uri={item.videos[0]} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>{userRole?.replace('_', ' ')}</Text>
        </View>
        <HamburgerButton onPress={() => setSidebarOpen(prev => !prev)} />
      </View>

      <View style={{ flex: 1, position: 'relative', backgroundColor: '#f5f5f5' }}>
        {renderFilters()}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{complaints.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#6c757d' }]}>
              {complaints.filter(c => c.status === 'SUBMITTED').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#fd7e14' }]}>
              {complaints.filter(c => c.status === 'PROCESSING').length}
            </Text>
            <Text style={styles.statLabel}>Processing</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#28a745' }]}>
              {complaints.filter(c => c.status === 'SOLVED').length}
            </Text>
            <Text style={styles.statLabel}>Solved</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>No complaints found.</Text>
            }
          />
        )}

        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          items={getSidebarItems()}
          userName={userProfile?.name}
          userRole={userRole}
        />
      </View>
    </SafeAreaView>
  );
};

import { COLORS } from '../../styles/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  filterSection: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: '#495057',
  },
  filterChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },
  date: {
    color: 'gray',
    fontSize: 11,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
  },
  videoContainer: {
      position: 'relative',
  },
  searchIconOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      marginTop: 6, // Matches image marginTop
      borderRadius: 8,
  },
});
