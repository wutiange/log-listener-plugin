import Server from "./server"


class Logger {

  private server: Server | null = null
  private baseData: Record<string, any> = {}

  setBaseUrl(url: string) {
    if (this.server) {
      this.server.updateUrl(url)
    } else {
      this.server = new Server(url)
    }
  }

  setBaseData(data: Record<string, any> = {}) {
    this.baseData = data
  }

  private _log(level: string, tag: string, ...data: any[]) {
    const sendData = {
      ...this.baseData, 
      message: data, 
      tag,
      level: level ?? 'log',
      createTime: Date.now()
    }
    this.server.log(sendData)
  }

  tag(tag: string, ...data: any[]) {
    this._log('log', tag, ...data)
  }

  log(...data: any[]) {
    this._log('log', 'default', ...data)
  }

  warn(...data: any[]) {
    this._log('warn', 'default', ...data)
  }

  error(...data: any[]) {
    this._log('error', 'default', ...data)
  }

  async uniqueReq(uniqueId: string, input: RequestInfo | URL, init?: RequestInit) {
    return this.server.network({
      ...this.baseData,
      url: input,
      uniqueId,
      method: init?.method ?? "get",
      headers: init?.headers,
      body: init?.body,
      createTime: Date.now(),
    })
  }

  private async _res(uniqueId?: string, id?: number, response?: Response, isTimeout = false) {
    const body = await response.text()
    return this.server.network({
      ...this.baseData,
      headers: (response?.headers as Record<string, any>)['map'],
      body,
      requestId: Number(id),
      statusCode: response?.status,
      endTime: Date.now(),
      isTimeout,
      uniqueId,
      isResponseError: id === undefined || id === null
    })
  }

  async uniqueRes(uniqueId: string, response?: Response, isTimeout = false) {
    return this._res(uniqueId, undefined, response, isTimeout)
  }

  async req(input: RequestInfo | URL, init?: RequestInit) {
    return this.uniqueReq(undefined, input, init)
  }

  async res(id: number, response?: Response, isTimeout = false) {
    return this._res(undefined, id, response, isTimeout)
  }
}


export default new Logger()