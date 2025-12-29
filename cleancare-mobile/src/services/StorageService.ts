import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Keys that should be stored securely
const SECURE_KEYS = ['userToken', 'refreshToken'];

export const StorageService = {
  /**
   * Set an item in storage. Automatically chooses SecureStore for sensitive keys.
   * @param key The key to store
   * @param value The value to store (string)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (SECURE_KEYS.includes(key) && Platform.OS !== 'web') {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get an item from storage. Checks SecureStore first for sensitive keys.
   * @param key The key to retrieve
   * @returns The stored value or null
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (SECURE_KEYS.includes(key) && Platform.OS !== 'web') {
        const result = await SecureStore.getItemAsync(key);
        // Fallback to AsyncStorage if not in SecureStore (migration path)
        if (!result) {
            const legacy = await AsyncStorage.getItem(key);
            if (legacy) {
                // Migrate to secure store
                await SecureStore.setItemAsync(key, legacy);
                await AsyncStorage.removeItem(key);
                return legacy;
            }
        }
        return result;
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove an item from storage.
   * @param key The key to remove
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (SECURE_KEYS.includes(key) && Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key);
      }
      // Always try removal from Async to be clean/safe
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },

  /**
   * Clear all app data (Logout)
   * explicitly clears known secure keys and then clears AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
          for (const key of SECURE_KEYS) {
            await SecureStore.deleteItemAsync(key);
          }
      }
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};
