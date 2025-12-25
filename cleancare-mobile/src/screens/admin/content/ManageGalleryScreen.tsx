import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../styles/theme';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export const ManageGalleryScreen = ({ navigation }: any) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedImages, setSelectedImages] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    useEffect(() => {
        fetchGallery();
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => {
                    resetForm();
                    setModalVisible(true);
                }} style={{ marginRight: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>+ Add</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const fetchGallery = async () => {
        try {
            const response = await axios.get(`${API_URL}/content/gallery`);
            // Transform URLs
            const data = response.data.map((post: any) => ({
                ...post,
                images: post.images.map((img: any) => ({
                    ...img,
                    imageUrl: img.imageUrl.startsWith('http') ? img.imageUrl : `${API_URL}/${img.imageUrl}`
                }))
            }));
            setPosts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const pickImages = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const handleSave = async () => {
        if (!title) {
            Alert.alert('Error', 'Title is required');
            return;
        }
        if (!isEditing && selectedImages.length === 0) {
            Alert.alert('Error', 'At least one image is required for new posts');
            return;
        }

        try {
            setUploading(true);
            const token = await AsyncStorage.getItem('userToken');

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);

            selectedImages.forEach((img, index) => {
                if (img.uri && !img.imageUrl) {
                    formData.append('images', {
                        uri: img.uri,
                        type: img.mimeType || 'image/jpeg',
                        name: `image_${index}.jpg`,
                    } as any);
                }
            });

            if (isEditing && selectedPostId) {
                await axios.put(`${API_URL}/content/gallery/${selectedPostId}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
            } else {
                await axios.post(`${API_URL}/content/gallery`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    }
                });
            }

            setModalVisible(false);
            resetForm();
            fetchGallery();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', isEditing ? 'Failed to update post' : 'Failed to create post');
        } finally {
            setUploading(false);
        }
    };

    const openEditModal = (post: any) => {
        setIsEditing(true);
        setSelectedPostId(post.id);
        setTitle(post.title);
        setDescription(post.description || '');

        const existingImages = (post.images || []).map((img: any) => ({
            ...img,
            uri: img.imageUrl
        }));
        setSelectedImages(existingImages);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        // Ideally implement delete endpoint in controller and here
        Alert.alert('Info', 'Delete not implemented in this demo (but backend supports it)');
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedImages([]);
        setIsEditing(false);
        setSelectedPostId(null);
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.imageCount}>{item.images?.length || 0} images</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, { backgroundColor: '#4CD964', marginRight: 8 }]}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#ff4d4d' }]}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 12}}>
              <Text style={{color: 'white', fontSize: 24}}>←</Text>
         </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Gallery</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ New Post</Text>
        </TouchableOpacity>
      </View> */}

            {loading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.empty}>No gallery posts</Text>}
                />
            )}

            <Modal visible={modalVisible} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{isEditing ? 'Edit Post' : 'New Gallery Post'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Event Title" />

                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Event Details..."
                            multiline
                        />

                        <Text style={styles.label}>Images ({selectedImages.length})</Text>
                        <ScrollView horizontal style={styles.imageScroll}>
                            {selectedImages.map((img, i) => (
                                <Image key={i} source={{ uri: img.uri }} style={styles.previewImage} />
                            ))}
                            <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
                                <Text style={{ fontSize: 30, color: '#aaa' }}>+</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitBtn, uploading && styles.disabledBtn]}
                            onPress={handleSave}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.submitBtnText}>{isEditing ? 'Update Post' : 'Post Event'}</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        backgroundColor: COLORS.primary, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    addBtn: { backgroundColor: 'white', padding: 8, borderRadius: 8 },
    addBtnText: { color: COLORS.primary, fontWeight: 'bold' },
    list: { padding: 16 },
    card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, flexDirection: 'row' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardDesc: { color: '#666', marginTop: 4 },
    imageCount: { marginTop: 8, fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
    empty: { textAlign: 'center', marginTop: 20, color: '#999' },
    actionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

    modalContainer: { flex: 1, backgroundColor: 'white' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    closeText: { color: 'red', fontSize: 16 },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    imageScroll: { flexDirection: 'row', marginBottom: 20 },
    previewImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
    pickBtn: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
    submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
