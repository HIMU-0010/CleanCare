import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import NotificationService from '../services/NotificationService';
import { COLORS } from '../styles/theme';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: string;
    data: any;
    read: boolean;
    sent_at: string;
}

export const NotificationListScreen = ({ navigation }: any) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await NotificationService.getNotificationHistory();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            await NotificationService.markAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
            );
        }

        // Handle navigation based on notification type
        if (notification.data?.complaintId) {
            let targetScreen = 'ComplaintDetail';

            // Use notification type to determine destination
            if (notification.type === 'SYSTEM' && notification.title === 'New Complaint Submitted') {
                // This is an admin notification
                targetScreen = 'AdminComplaintDetail';
            } else if (notification.type === 'COMPLAINT_STATUS_UPDATE') {
                // This is a citizen notification
                targetScreen = 'ComplaintDetail';
            } else {
                // Fallback: Check user role
                try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    const profileStr = await AsyncStorage.getItem('userProfile');
                    if (profileStr) {
                        const profile = JSON.parse(profileStr);
                        const isAdmin = profile.role === 'WARD_ADMIN' || profile.role === 'SUPER_ADMIN' || profile.role === 'MASTER_ADMIN';
                        if (isAdmin) targetScreen = 'AdminComplaintDetail';
                    }
                } catch (e) {
                    console.error("Error checking role:", e);
                }
            }

            navigation.navigate(targetScreen, {
                complaintId: notification.data.complaintId,
            });
        }
    };

    const handleMarkAllRead = async () => {
        await NotificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'COMPLAINT_STATUS_UPDATE':
                return 'circle-check';
            case 'NEW_ANNOUNCEMENT':
                return 'bullhorn';
            case 'EMERGENCY_CONTACT_UPDATE':
                return 'circle-exclamation';
            case 'GALLERY_POST':
                return 'images';
            default:
                return 'bell';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'COMPLAINT_STATUS_UPDATE':
                return COLORS.primary;
            case 'NEW_ANNOUNCEMENT':
                return '#007AFF';
            case 'EMERGENCY_CONTACT_UPDATE':
                return '#FF3B30';
            case 'GALLERY_POST':
                return '#FF9500';
            default:
                return '#8E8E93';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMins < 1) return 'Just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
                <FontAwesome6
                    name={getNotificationIcon(item.type) as any}
                    size={24}
                    color={getNotificationColor(item.type)}
                />
            </View>

            <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                    {item.title}
                </Text>
                <Text style={styles.body} numberOfLines={2}>
                    {item.body}
                </Text>
                <Text style={styles.time}>{formatDate(item.sent_at)}</Text>
            </View>

            {!item.read && <View style={styles.unreadIndicator} />}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <SafeAreaView style={styles.container}>
            {unreadCount > 0 && (
                <View style={styles.header}>
                    <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <Text style={styles.markAllRead}>Mark all read</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FontAwesome6 name="bell-slash" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <Text style={styles.emptySubtext}>
                            You'll be notified about complaint updates and important announcements
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    unreadText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    markAllRead: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    list: {
        padding: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        color: '#333',
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: '600',
    },
    body: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    unreadIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#BBB',
        textAlign: 'center',
        lineHeight: 20,
    },
});
