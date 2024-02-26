import logger from './index'
import { sleep } from './utils'

// @ts-ignore
const tempFetch = global.fetch as typeof fetch

// @ts-ignore
global.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const uniqueId = (Date.now() + Math.random()).toString(16)
  logger.uniqueReq(uniqueId, input, init)
  let isFetchFinished = false
  if (logger.getTimeout() !== null) {
    sleep(logger.getTimeout()).then(() => {
      if (!isFetchFinished) {
        logger.resTimeout(uniqueId)
      }
    })
  }

  try {
    const response = await tempFetch(input, init)
    isFetchFinished = true
    if (response instanceof Response) {
      logger.uniqueRes(uniqueId, response)
    }
    return response
  } catch (error) {
    isFetchFinished = true
    logger.resResponseError(uniqueId)
    throw new Error(error)
  }
}