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