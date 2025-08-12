/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import logger from '@wutiange/log-listener-plugin';

// 把 testUrl 更换成你自己的 IP 地址
logger.config({isAuto: true, testUrl: 'http://172.16.102.169:27751'});
// 通过发现服务的方式
// logger.config({isAuto: true});

AppRegistry.registerComponent(appName, () => App);
