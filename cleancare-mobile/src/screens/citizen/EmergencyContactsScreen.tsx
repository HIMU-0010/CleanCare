import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import Ionicons from '@expo/vector-icons/Ionicons';

const PRIMARY_RED = '#FF4D4D';
const SECONDARY_RED = '#FFE5E5';

interface Contact {
  id: string;
  title: string;
  subtitle?: string;
  phone: string;
  icon?: string;
  color?: string;
}

export const EmergencyContactsScreen = ({ navigation }: any) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts', error);
      // Fallback data for demo if backend is empty/fails
      setContacts([
        { id: '1', title: 'DSCC Emergency', subtitle: 'Waste Emergency & Urban Services', phone: '16106', icon: 'alert-circle', color: '#FF4D4D' },
        { id: '2', title: 'National Emergency', subtitle: 'Police, Fire & Ambulance', phone: '999', icon: 'shield', color: '#007AFF' },
        { id: '3', title: 'Fire Service', subtitle: 'Fire & rescue services', phone: '102', icon: 'flame', color: '#FF9500' },
        { id: '4', title: 'Ambulance', subtitle: 'Medical emergency', phone: '199', icon: 'medkit', color: '#4CD964' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderItem = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: item.color || PRIMARY_RED }]}>
        {/* <Ionicons name={item.icon as any || 'call'} size={24} color="white" /> */}
        {/* <Text style={{ color: 'white', fontWeight: 'bold' }}>!</Text> */}
        <Ionicons name="warning-outline" size={24} color="white" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.cardSubtitle}>{item.subtitle}</Text>}
        <TouchableOpacity
          style={[styles.callButton, { backgroundColor: item.color || PRIMARY_RED }]}
          onPress={() => handleCall(item.phone)}
        >
          <Text style={styles.callButtonText}> <Ionicons name="call" size={16} color="white" />  Call {item.phone}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
      </View> */}

      <View style={styles.banner}>
        <Ionicons name="warning-outline" size={24} color="red" />
        <Text style={styles.bannerText}> Call these only in real emergency situations</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY_RED} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={() => (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}> <Ionicons name="call" size={20} color="gray" />  When to Call DSCC Emergency</Text>
              <Text style={styles.infoText}>• Illegal waste dumping in progress</Text>
              <Text style={styles.infoText}>• Hazardous waste spillage</Text>
              <Text style={styles.infoText}>• Blocked drainage causing flooding</Text>
              <Text style={styles.infoText}>• Dead animal removal</Text>
              <Text style={styles.infoText}>• Environmental hazards</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: PRIMARY_RED,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // paddingTop: 40, // if safely area view doesn't handle top status bar color
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  banner: {
    backgroundColor: SECONDARY_RED,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcccb'
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  bannerText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  callButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#F0F9F4', // Light green hint
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    lineHeight: 20,
  },
});
