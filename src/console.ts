import logger from './index'
const { log, warn, error } = console


console.log = function (...data: any[]) {
  logger.log(...data)
  log(...data)
}

console.warn = function (...data: any[]) {
  logger.warn(...data)
  warn(...data)
}

console.error = function (...data: any[]) {
  logger.error(...data)
  error(...data)
}