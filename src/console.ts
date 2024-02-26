import logger from './index'

const [log, warn, error] = [console.log, console.warn, console.error]

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