import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import logger from '@wutiange/log-listener-plugin';

// 填写你的服务器地址
logger.setBaseUrl('http://192.168.3.52');
logger.auto()
// console.log(logger)

AppRegistry.registerComponent(appName, () => App);
