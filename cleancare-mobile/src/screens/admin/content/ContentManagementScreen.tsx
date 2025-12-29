import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../styles/theme';
import { FontAwesome6 } from '@expo/vector-icons';

export const ContentManagementScreen = ({ navigation }: any) => {
  const menuItems = [
    {
      title: 'Emergency Contacts',
      subtitle: 'Manage numbers & priorities',
      icon: 'phone',
      route: 'ManageContacts',
      color: '#FF4D4D'
    },
    {
      title: 'Government Calendar',
      subtitle: 'Upload annual calendar',
      icon: 'calendar-days',
      route: 'ManageCalendar',
      color: COLORS.primary
    },
    {
      title: 'Photo Gallery',
      subtitle: 'Post events & photos',
      icon: 'images',
      route: 'ManageGallery',
      color: '#FF9500'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Management</Text>
      </View> */}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select a module to manage</Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <FontAwesome6 name={item.icon as any} size={20} color="white" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    marginLeft: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: 'bold',
  }
});
