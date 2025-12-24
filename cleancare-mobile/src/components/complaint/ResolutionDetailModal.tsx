
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaGallery } from '../common/MediaGallery'; // Assuming this can be reused
import { COLORS } from '../../styles/theme';

interface ResolutionDetailModalProps {
    visible: boolean;
    onClose: () => void;
    status: string;
    resolutionImages?: string[];
    resolutionVideos?: string[];
    resolutionDescription?: string;
}

export const ResolutionDetailModal: React.FC<ResolutionDetailModalProps> = ({
    visible,
    onClose,
    status,
    resolutionImages = [],
    resolutionVideos = [],
    resolutionDescription,
}) => {
    const isSolved = status === 'SOLVED';
    const title = isSolved ? 'Resolution Report' : 'Rejection Details';
    const descriptionLabel = isSolved ? 'Resolution Description' : 'Reason for Rejection';
    const dateLabel = isSolved ? 'Resolved on' : 'Rejected on';

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Status Banner */}
                        <View style={[styles.statusBanner, { backgroundColor: isSolved ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Ionicons
                                name={isSolved ? 'checkmark-circle' : 'alert-circle'}
                                size={24}
                                color={isSolved ? 'green' : 'red'}
                            />
                            <Text style={[styles.statusText, { color: isSolved ? 'green' : 'red' }]}>
                                This complaint was marked as {status}
                            </Text>
                        </View>

                        {/* Media */}
                        {(resolutionImages.length > 0 || resolutionVideos.length > 0) ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Proof of Action</Text>
                                <MediaGallery images={resolutionImages} videos={resolutionVideos} />
                            </View>
                        ) : null}

                        {/* Description */}
                        {resolutionDescription ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{descriptionLabel}</Text>
                                <Text style={styles.description}>{resolutionDescription}</Text>
                            </View>
                        ) : null}

                        {!resolutionDescription && resolutionImages.length === 0 && resolutionVideos.length === 0 && (
                            <Text style={styles.emptyText}>No detailed report available.</Text>
                        )}

                    </ScrollView>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 15,
        maxHeight: '80%',
        width: '100%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        padding: 20,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        gap: 10,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginVertical: 20,
    },
    closeButton: {
        backgroundColor: COLORS.cancel,
        padding: 15,
        alignItems: 'center',
        margin: 20,
        borderRadius: 10,
    },
    closeButtonText: {
        color: COLORS.cancel_text,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
