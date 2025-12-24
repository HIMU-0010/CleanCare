import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from '../../services/NotificationService';
import { COLORS } from '../../styles/theme';

interface NotificationBellProps {
    onPress: () => void;
    color?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onPress, color = '#fff' }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            const count = await NotificationService.getUnreadCount();
            setUnreadCount(count);
        };

        fetchUnreadCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <Ionicons name="notifications" size={24} color={color} />
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
