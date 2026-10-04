import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoragePort } from '@repo/core';

export const mobileStorage: StoragePort = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};
