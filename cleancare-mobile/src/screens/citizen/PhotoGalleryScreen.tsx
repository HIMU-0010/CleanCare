import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { COLORS } from '../../styles/theme';
import { FontAwesome6 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const IMAGE_GAP = 8;
const ITEM_WIDTH = Math.floor((width - 66 - (IMAGE_GAP * 2)) / 3);

interface GalleryImage {
  id: string;
  imageUrl: string;
}

interface GalleryPost {
  id: string;
  title: string;
  description: string;
  date: string;
  images: GalleryImage[];
}

export const PhotoGalleryScreen = ({ navigation }: any) => {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API_URL}/content/gallery`);
      // Transform URLs if needed
      const data = response.data.map((post: any) => ({
        ...post,
        images: post.images.map((img: any) => ({
          ...img,
          imageUrl: img.imageUrl.startsWith('http') ? img.imageUrl : `${API_URL}/${img.imageUrl}`
        }))
      }));
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch gallery', error);
      // Fallback Demo
      // setPosts([
      //     {
      //         id: '1',
      //         title: 'Clean Dhaka Initiative',
      //         description: 'Tree plantation drive – 500+ trees planted this month\n\nCommunity cleaning event scheduled for next Saturday',
      //         date: new Date().toISOString(),
      //         images: [
      //             { id: '1', imageUrl: 'https://via.placeholder.com/150' },
      //             { id: '2', imageUrl: 'https://via.placeholder.com/150' },
      //             { id: '3', imageUrl: 'https://via.placeholder.com/150' },
      //         ]
      //     }
      // ]);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }: { item: GalleryPost }) => (
    <View style={styles.card}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postDesc}>{item.description}</Text>

      <View style={styles.imageGrid}>
        {item.images.slice(0, 6).map((img, index) => (
          <Image
            key={img.id}
            source={{ uri: img.imageUrl }}
            style={[
              styles.gridImage,
              { marginRight: (index + 1) % 3 === 0 ? 0 : IMAGE_GAP }
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Gallery</Text>
      </View> */}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No events to show.</Text>
            </View>
          }
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  postDesc: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    lineHeight: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridImage: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 8,
    marginBottom: IMAGE_GAP,
    backgroundColor: '#f0f0f0',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  }
});
