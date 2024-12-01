/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import logger from '@wutiange/log-listener-plugin';

// 把 testUrl 更换成你自己的 IP 地址
logger.config({isAuto: true, testUrl: '192.168.3.52'});

AppRegistry.registerComponent(appName, () => App);
