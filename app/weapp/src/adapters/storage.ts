import Taro from '@tarojs/taro';
import type { StoragePort } from '@repo/core';

export const weappStorage: StoragePort = {
  async get(key) {
    try {
      const result = await Taro.getStorage({ key });
      return typeof result.data === 'string' ? result.data : null;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    await Taro.setStorage({ key, data: value });
  },
  async remove(key) {
    await Taro.removeStorage({ key });
  },
};
