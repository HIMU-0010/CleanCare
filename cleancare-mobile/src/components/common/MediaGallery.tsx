import React, { useState } from 'react';
import { View, Image, StyleSheet, ScrollView, Dimensions, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

interface MediaGalleryProps {
  images?: string[];
  videos?: string[];
}

// Sub-component for individual video handling
const VideoItem = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play(); // Auto-play when loaded? Or wait? 
    // User requested "preview", usually auto-play or needs controls.
    // Expo VideoView has native controls by default or configured differently.
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView 
        style={styles.media} 
        player={player} 
        contentFit="contain"
      />
    </View>
  );
};

export const MediaGallery = ({ images = [], videos = [] }: MediaGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if ((!images || images.length === 0) && (!videos || videos.length === 0)) {
    return (
      <View style={styles.placeholder}>
        <Text style={{ color: 'gray' }}>No Media Attached</Text>
      </View>
    );
  }

  const allMedia = [
    ...images.map(uri => ({ type: 'image', uri })),
    ...videos.map(uri => ({ type: 'video', uri }))
  ];

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        pagingEnabled 
        showsHorizontalScrollIndicator={false} 
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {allMedia.map((item, index) => (
          <View key={index} style={styles.mediaContainer}>
            {item.type === 'image' ? (
              <Image 
                source={{ uri: item.uri }} 
                style={styles.media} 
                resizeMode="cover"
              />
            ) : (
              <VideoItem uri={item.uri} />
            )}
            
            {/* Show type badge */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>
                    {item.type === 'image' ? 'PHOTO' : 'VIDEO'} {index + 1}/{allMedia.length}
                </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Dots Indicator */}
      {allMedia.length > 1 && (
        <View style={styles.pagination}>
            {allMedia.map((_, i) => (
                <View 
                    key={i} 
                    style={[
                        styles.dot, 
                        { opacity: i === activeIndex ? 1 : 0.3 }
                    ]} 
                />
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: '#000',
    position: 'relative',
  },
  scroll: {
    flex: 1,
  },
  placeholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  mediaContainer: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoContainer: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: width,
    height: 300,
  },
  badge: {
      position: 'absolute',
      top: 15,
      right: 15,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 15,
  },
  badgeText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
  },
  pagination: {
      position: 'absolute',
      bottom: 10,
      flexDirection: 'row',
      alignSelf: 'center',
  },
  dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'white',
      marginHorizontal: 3,
  },
});
