
// import logger from '@wutiange/log-listener-plugin'
// import '@wutiange/log-listener-plugin/dist/fetch'
// import '@wutiange/log-listener-plugin/dist/console'
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import DeviceInfo from 'react-native-device-info'
import './console'

// async function initLogger() {
//   logger.setBaseUrl("http://192.168.118.103")
//   logger.setBaseData({
//     env: 'debug',
//     version: "1.0.0",
//     brand: DeviceInfo.getBrand(),
//     model: DeviceInfo.getModel(),
//     appVersion: DeviceInfo.getVersion(),
//     carrier: DeviceInfo.getCarrierSync(),
//     manufacturer: DeviceInfo.getManufacturerSync(),
//     systemName: DeviceInfo.getSystemName(),
//     uniqueId: DeviceInfo.getUniqueId(),
//   })
// }

// initLogger()

AppRegistry.registerComponent(appName, () => App);
