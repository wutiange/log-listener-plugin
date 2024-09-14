# log-listener-plugin

[![Dependencies](https://img.shields.io/badge/dependencies-none-green)](https://www.npmjs.com/package/@wutiange/log-listener-plugin?activeTab=dependencies)
[![npm](https://img.shields.io/npm/v/@wutiange/log-listener-plugin)](https://www.npmjs.com/package/@wutiange/log-listener-plugin)
[![npm downloads](https://img.shields.io/npm/dm/@wutiange/log-listener-plugin)](https://www.npmjs.com/package/@wutiange/log-listener-plugin)
[![License](https://img.shields.io/npm/l/@wutiange/log-listener-plugin)](./LICENSE)

中文 | [English](./docs/README_EN.md)

要想正常使用 [log-record](https://github.com/wutiange/log-record) 客户端来收集日志，方便排查问题，那么就需要把这个插件安装到项目中。

## 安装

使用 npm 安装
```bash
npm install @wutiange/log-listener-plugin
```

使用 yarn 安装
```bash
yarn add @wutiange/log-listener-plugin
```

## 使用
在项目的入口文件中引入，一般为 `index.ts` 文件。
```ts
import logger from '@wutiange/log-listener-plugin';
// 填写日志服务器的地址
logger.setBaseUrl('http://127.0.0.1');
// 设置基础数据，一般数据从 react-native-device-info 中获取，这里你按自己的情况来上报即可，当然你也可以不设置
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

// 启动日志记录
logger.auto();

// 停止日志记录
logger.unAuto();
```
上面的是最简单的方式，如果你想只抓取日志或网络日志，那么可以采用下面的方式：
```ts
// 只抓取日志
logger.startRecordLog();
// 只抓取网络日志
logger.startRecordNetwork();
```

## 其他重要说明
在配置 baseUrl 的时候，必须填写的是 [log-record](https://github.com/wutiange/log-record) 的地址，也就是你在什么电脑打开的 log-record 客户端，那么这里添加的就是对应电脑的 ip 地址。集成这个插件的 app 端要保证跟 log-record 客户端在同一个局域网下。