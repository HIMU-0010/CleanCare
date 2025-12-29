import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NotificationService from '../../services/NotificationService';
import NotificationEvents from '../../utils/NotificationEvents';
import { COLORS } from '../../styles/theme';

interface NotificationBellProps {
    onPress: () => void;
    color?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onPress, color = '#fff' }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const navigation = useNavigation();

    const fetchUnreadCount = async () => {
        const count = await NotificationService.getUnreadCount();
        setUnreadCount(count);
    };

    useEffect(() => {
        fetchUnreadCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        // Refresh when screen comes into focus
        const unsubscribe = navigation.addListener('focus', fetchUnreadCount);

        // Refresh when new notification arrives in foreground
        NotificationEvents.onBadgeRefresh(fetchUnreadCount);

        return () => {
            clearInterval(interval);
            unsubscribe();
            NotificationEvents.removeBadgeRefreshListener(fetchUnreadCount);
        };
    }, [navigation]);

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <FontAwesome6 name="bell" size={24} color={color} />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginRight: 10,
        position: 'relative',
        paddingTop: 5,
        paddingRight: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 19,
        height: 19,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
