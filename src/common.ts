export enum Level {
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
}

export enum Tag {
  LOG_PLUGIN_INTERNAL_ERROR = 'log-plugin-internal-error',
  DEFAULT = 'default',
}


export const getBaseData = (): Record<string, string> => {
  try {
    const DeviceInfo = require("react-native-device-info")?.default;
    return {
      brand: DeviceInfo.getBrand(),
      model: DeviceInfo.getModel(),
      appVersion: DeviceInfo.getVersion(),
      carrier: DeviceInfo.getCarrierSync(),
      manufacturer: DeviceInfo.getManufacturerSync(),
      systemName: DeviceInfo.getSystemName()
    };
  } catch (error) {
    return {}
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

export const URLS_KEY = 'log-listener-plugin-urls$$key'