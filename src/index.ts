import Server from "./server"


class Logger {

  private server: Server | null = null
  private baseData: Record<string, any>

  setBaseUrl(url: string) {
    if (this.server) {
      this.server.updateUrl(url)
    } else {
      this.server = new Server(url)
    }
  }

  setBaseData(data: Record<string, any>) {
    this.baseData = data
  }

  private throwNotSetBaseUrl() {
    if (!this.server) {
      throw new Error("请先设置 baseUrl ，用于将数据上传到日志系统中，一般是日志系统打开所在的电脑端口号")
    }
  }

  private throwNotSetBaseData() {
    if (!this.server) {
      throw new Error("请先设置基础数据，也就是每一条日志都包含的数据")
    }
  }

  private _log(level: string, ...data: any[]) {
    this.throwNotSetBaseUrl()
    this.throwNotSetBaseData()
    const sendData = {
      ...this.baseData, 
      message: data, 
      level: level ?? 'log',
      createTime: Date.now()
    }
    this.server.log(sendData)
  }

  log(...data: any[]) {
    this._log('log', data)
  }

  warn(...data: any[]) {
    this._log('warn', data)
  }

  error(...data: any[]) {
    this._log('error', data)
  }

  async req(input: RequestInfo | URL, init?: RequestInit) {
    return this.server.network({
      ...this.baseData,
      url: input,
      method: init?.method ?? "get",
      headers: init?.headers,
      body: init?.body,
      createTime: Date.now(),
    })
  }

  async res(id: number, response?: Response, isTimeout = false) {
    const body = await response.text()
    return this.server.network({
      ...this.baseData,
      headers: response?.headers,
      body,
      requestId: id,
      statusCode: response?.status,
      endTime: Date.now(),
      isTimeout,
    })
  }
}


export default new Logger()