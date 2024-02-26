import Server from "./server"


class Logger {

  private server: Server | null = null
  private baseData: Record<string, any> = {}
  private timeout: number | null = null

  setBaseUrl(url: string) {
    if (this.server) {
      this.server.updateUrl(url)
    } else {
      this.server = new Server(url)
    }
  }

  setFetch(nativeFetch: typeof fetch) {
    this.server?.updateNativeFetch(nativeFetch)
  }

  setTimeout(timeout: number) {
    if (typeof timeout === 'number') {
      this.timeout = timeout
      this.server?.updateTimeout(this.timeout)
    }
  }

  getTimeout() {
    if (typeof this.timeout === 'number') {
      return this.timeout
    }
    return null
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
    this.server?.log(sendData)
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
    return this.server?.network({
      ...this.baseData,
      url: input,
      id: uniqueId,
      method: init?.method ?? "get",
      headers: init?.headers,
      body: init?.body,
      createTime: Date.now(),
    })
  }

  private async _res(uniqueId?: string, id?: number, response?: Response) {
    const body = await response.text()
    return this.server?.network({
      ...this.baseData,
      headers: (response?.headers as Record<string, any>)['map'],
      body,
      requestId: uniqueId ?? Number(id),
      statusCode: response?.status,
      endTime: Date.now(),
    })
  }

  async resTimeout(uniqueId: string) {
    return this.server?.network({
      ...this.baseData,
      isTimeout: true,
      uniqueId,
    })
  }

  async resResponseError(uniqueId: string) {
    return this.server?.network({
      ...this.baseData,
      isResponseError: true,
      uniqueId,
    }) 
  }

  async uniqueRes(uniqueId: string, response?: Response) {
    return this._res(uniqueId, undefined, response)
  }

  async req(input: RequestInfo | URL, init?: RequestInit) {
    return this.uniqueReq(undefined, input, init)
  }

  async res(id: number, response?: Response) {
    return this._res(undefined, id, response)
  }
}


export default new Logger()