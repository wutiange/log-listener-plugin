import logger from "./logger";

export const URLS_KEY = 'log-listener-plugin-urls$$SetKey'
export const DEFAULT_TIMEOUT = 3000
export const LOG_KEY = '[@wutiange/log-listener-plugin 日志]'
export enum Level {
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
}

export enum Tag {
  LOG_PLUGIN_INTERNAL_ERROR = 'log-plugin-internal-error',
  DEFAULT = 'default',
}

const getDefaultDeviceINfo = () => {
  try {
    const {Platform} = require('react-native')
    return {
      SystemName: Platform.OS,
      Version: Platform.Version,
      ...Platform.constants
    }
  } catch (error) {
    logger.warn(LOG_KEY, '这个插件只能在 react-native 中使用')
    return {}
  }
}

export const getBaseData = (): Record<string, string> => {
  
  try {
    const DeviceInfo = require("react-native-device-info")?.default;
    return {
      Brand: DeviceInfo.getBrand(),
      Model: DeviceInfo.getModel(),
      AppVersion: DeviceInfo.getVersion(),
      Carrier: DeviceInfo.getCarrierSync(),
      Manufacturer: DeviceInfo.getManufacturerSync(),
      SystemName: DeviceInfo.getSystemName(),
      ...getDefaultDeviceINfo()
    };
  } catch (error) {
    return getDefaultDeviceINfo()
  }
}

export const getDefaultStorage = (): Storage => {
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage")?.default;
    return AsyncStorage;
  } catch (error) {
    return null;
  }
}

