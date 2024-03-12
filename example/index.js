/**
 * @format
 */
import '@wutiange/log-listener-plugin/dist/console';
import '@wutiange/log-listener-plugin/dist/fetch';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import logger from '@wutiange/log-listener-plugin';

logger.setBaseUrl('http://192.168.118.103');

AppRegistry.registerComponent(appName, () => App);
