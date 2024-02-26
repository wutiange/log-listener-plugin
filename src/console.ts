import { error, log, warn } from './common'
import logger from './index'


console.log = (...data: any[]) => {
  logger.log(...data)
  log(...data)
}

console.warn = (...data: any[]) => {
  logger.warn(...data)
  warn(...data)
}

console.error = (...data: any[]) => {
  logger.error(...data)
  error(...data)
}