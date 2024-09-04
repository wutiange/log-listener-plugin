/**
 * @fileoverview
 * @deprecated 不需要手动导入文件，使用 logger.auto 就会自动开始收集日志
 */

import logger from './src/logPlugin';
const common = require('./src/common');
console.log = (...data: any[]) => {
  logger.log(...data);
  common.log(...data);
};

console.warn = (...data: any[]) => {
  logger.warn(...data);
  common.warn(...data);
};

console.error = (...data: any[]) => {
  logger.error(...data);
  common.error(...data);
};