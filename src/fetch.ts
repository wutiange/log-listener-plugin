import logger from './index'
import { sleep } from './utils'
// @ts-ignore
export const tempFetch = global.fetch as typeof fetch
logger.setFetch(tempFetch)
// @ts-ignore
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const uniqueId = (Date.now() + Math.random()).toString(16)
  logger.uniqueReq(uniqueId, input, init)
  let isFetchFinished = false
  let isTimeout = false
  if (logger.getTimeout() !== null) {
    sleep(logger.getTimeout()).then(() => {
      if (!isFetchFinished) {
        isTimeout = true
        logger.resTimeout(uniqueId)
      }
    })
  }

  try {
    const response = await tempFetch(input, init)
    isFetchFinished = true
    if (response instanceof Response && !isTimeout) {
      logger.uniqueRes(uniqueId, response.clone())
    }
    return response
  } catch (error) {
    isFetchFinished = true
    if (!isTimeout) {
      logger.resResponseError(uniqueId)
    }
    throw new Error(error)
  }
}