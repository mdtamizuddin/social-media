import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Dynamically load SecureStore only on native to avoid Web module-level crashes
const SecureStore = isWeb ? null : (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-secure-store') as typeof import('expo-secure-store');
})();

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore!.getItemAsync(key);
  } catch (error) {
    console.error(`Error getting item ${key} from storage:`, error);
    return null;
  }
};

export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore!.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error setting item ${key} in storage:`, error);
  }
};

export const deleteSecureItem = async (key: string): Promise<void> => {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore!.deleteItemAsync(key);
  } catch (error) {
    console.error(`Error deleting item ${key} from storage:`, error);
  }
};
