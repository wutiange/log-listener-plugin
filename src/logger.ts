const [log, warn, error] = [console.log, console.warn, console.error];

const logger = {
  log: (...data: any[]) => {
    log(...data)
  },
  warn: (...data: any[]) => {
    warn(...data)
  },
  error: (...data: any[]) => {
    error(...data)
  },
}

export default logger