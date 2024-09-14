# log-listener-plugin

[![Dependencies](https://img.shields.io/badge/dependencies-none-green)](https://www.npmjs.com/package/@wutiange/log-listener-plugin?activeTab=dependencies)
[![npm](https://img.shields.io/npm/v/@wutiange/log-listener-plugin)](https://www.npmjs.com/package/@wutiange/log-listener-plugin)
[![npm downloads](https://img.shields.io/npm/dm/@wutiange/log-listener-plugin)](https://www.npmjs.com/package/@wutiange/log-listener-plugin)
[![License](https://img.shields.io/npm/l/@wutiange/log-listener-plugin)](./LICENSE)

[中文](../README.md) | English

To properly use the [log-record](https://github.com/wutiange/log-record) client for collecting logs and facilitating troubleshooting, you need to install this plugin in your project.

## Install

Using npm:
```bash
npm install @wutiange/log-listener-plugin
```

Using yarn:
```bash
yarn add @wutiange/log-listener-plugin
```

## Usage

In the entry file of your project, usually the `index.ts` file.

```ts
import logger from '@wutiange/log-listener-plugin';
// Set the address of the log server
logger.setBaseUrl('http://127.0.0.1');
// Set the basic data, usually the data is obtained from react-native-device-info, here you can report according to your own situation, of course, you can also not set it
logger.setBaseData({
  version: displayVersion,
  brand: DeviceInfo.getBrand(),
  model: DeviceInfo.getModel(),
  appVersion: DeviceInfo.getVersion(),
  carrier: DeviceInfo.getCarrierSync(),
  manufacturer: DeviceInfo.getManufacturerSync(),
  systemName: DeviceInfo.getSystemName(),
  deviceUniqueId: DeviceInfo.getUniqueId(),
});

// Start logging
logger.auto();

// Stop logging
logger.unAuto();
```

  ## Other important notes

When configuring the baseUrl, you must fill in the address of [log-record](https://github.com/wutiange/log-record), that is, the address of the log-record client on the computer you opened, so here you add the IP address of the corresponding computer. The app side that integrates this plugin must ensure that it is in the same LAN as the log-record client.