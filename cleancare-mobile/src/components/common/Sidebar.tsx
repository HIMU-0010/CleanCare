import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;

interface SidebarItem {
  label: string;
  icon?: string;
  onPress: () => void;
  color?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: SidebarItem[];
  userName?: string;
  userRole?: string;
}

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

export const Sidebar = ({ isOpen, onClose, items, userName, userRole }: SidebarProps) => {
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Safe navigation retrieval
  let currentRoute = '';
  try {
    const route = useRoute();
    currentRoute = route.name;
  } catch (e) {
    // ignore
  }

  const getMenuItems = () => {
    // Base items from props, or generate if empty (backward compatibility)
    let menuItems = [...items];

    // If strict role-based items are preferred over passed items:
    if (userRole === 'MASTER_ADMIN') {
      const adminItem = {
        label: 'Manage Admins',
        onPress: () => { onClose(); navigation.navigate('AdminManagement'); },
        color: undefined,
        icon: 'users-gear'
      };
      const locItem = {
        label: 'Manage Corporations',
        onPress: () => { onClose(); navigation.navigate('ManageCorporations'); },
        color: undefined,
        icon: 'building'
      };
      const contentItem = {
        label: 'Manage Content',
        onPress: () => { onClose(); navigation.navigate('ContentManagement'); },
        color: undefined,
        icon: 'layer-group'
      };

      // Avoid duplicates if passed via items
      if (!menuItems.some(i => i.label === 'Manage Admins')) menuItems.unshift(adminItem);
      // Correctly place Locations item
      const adminIndex = menuItems.findIndex(i => i.label === 'Manage Admins');
      if (!menuItems.some(i => i.label === 'Manage Corporations')) {
        if (adminIndex !== -1) menuItems.splice(adminIndex + 1, 0, locItem);
        else menuItems.unshift(locItem);
      }

      // Add Content Management
      const locIndex = menuItems.findIndex(i => i.label === 'Manage Corporations');
      if (!menuItems.some(i => i.label === 'Manage Content')) {
        if (locIndex !== -1) menuItems.splice(locIndex + 1, 0, contentItem);
        else menuItems.push(contentItem);
      }
    }

    return menuItems;
  };

  const menuItems = getMenuItems();

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
            paddingBottom: insets.bottom + 20, // Add safe area padding + extra
            paddingTop: 10 // Keep top padding 
          }
        ]}
      >
        {/* User Info */}
        {(userName || userRole) && (
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            {userName && <Text style={styles.userName}>{userName}</Text>}
            {userRole && <Text style={styles.userRole}>{userRole.replace('_', ' ')}</Text>}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => ( // Use the dynamically created menuItems array
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                onClose();
                item.onPress();
              }}
            >
              {item.icon && <FontAwesome6 name={item.icon as any} size={20} color={item.color || COLORS.primary} style={styles.menuIcon} />}
              <Text style={[styles.menuLabel, item.color ? { color: item.color } : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Close Button */}
        {/* <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity> */}
      </Animated.View>
    </View>
  );
};

// Hamburger Menu Button Component
export const HamburgerButton = ({ onPress, color = '#333' }: { onPress: () => void; color?: string }) => (
  <TouchableOpacity style={styles.hamburger} onPress={onPress}>
    <Text style={[styles.hamburgerText, { color }]}>☰</Text>
  </TouchableOpacity>
);

import { COLORS } from '../../styles/theme';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  userRole: {
    color: COLORS.lightGray,
    fontSize: 12,
    marginTop: 4,
  },
  menuSection: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuLabel: {
    color: COLORS.primary,
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  closeText: {
    color: COLORS.primary,
    fontSize: 24,
  },
  hamburger: {
    padding: 8,
  },
  hamburgerText: {
    fontSize: 24,
    color: '#333', // Default, overridden by props usually
  },
});
