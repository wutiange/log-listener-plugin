import logger from './index'

import('./common.js').then(common => {
  console.log = (...data: any[]) => {
    logger.log(...data)
    common.log(...data)
  }
  
  console.warn = (...data: any[]) => {
    logger.warn(...data)
    common.warn(...data)
  }
  
  console.error = (...data: any[]) => {
    logger.error(...data)
    common.error(...data)
  }
})

