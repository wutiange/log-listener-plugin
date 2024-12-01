import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import logger from '@wutiange/log-listener-plugin';

logger.config({isAuto: true});

AppRegistry.registerComponent(appName, () => App);
