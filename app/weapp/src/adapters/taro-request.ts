import Taro from '@tarojs/taro';
import type { TaroRequestLike, TaroRequestTaskLike } from './http';

export const taroRequest: TaroRequestLike = (options) =>
  Taro.request({
    url: options.url,
    method: options.method as 'GET',
    header: { ...options.header },
    data: options.data,
    timeout: options.timeout,
    success: (response) =>
      options.success({
        statusCode: response.statusCode,
        data: response.data,
        header: response.header,
      }),
    fail: (error) => options.fail({ errMsg: error.errMsg }),
  }) as TaroRequestTaskLike;
