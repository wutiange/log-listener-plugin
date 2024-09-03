/**
 * @fileoverview
 * @deprecated 不需要手动导入文件，使用 logger.auto 就会自动开始收集日志
 */
import logger from './index';
import {sleep} from './utils';

import('./common.js').then(common => {
  // @ts-ignore
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const uniqueId = (Date.now() + Math.random()).toString(16);
    logger.uniqueReq(uniqueId, input, init);
    let isFetchFinished = false;
    let isTimeout = false;
    const timeout = logger.getTimeout()
    if (timeout !== null) {
      sleep(timeout).then(() => {
        if (!isFetchFinished) {
          isTimeout = true;
          logger.resTimeout(uniqueId);
        }
      });
    }

    try {
      const response = await common.tempFetch(input, init);
      isFetchFinished = true;
      if (response instanceof Response && !isTimeout) {
        logger.uniqueRes(uniqueId, response.clone());
      }
      return response;
    } catch (error) {
      isFetchFinished = true;
      if (!isTimeout) {
        logger.resResponseError(uniqueId);
      }
      throw new Error(error);
    }
  };
});
