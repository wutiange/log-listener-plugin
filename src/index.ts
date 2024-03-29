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
    let url: string | null = null
    let method = init?.method ?? 'get'
    let headers = init?.headers
    let body = init?.body
    if (input instanceof Request) {
      url = input.url
      method = input.method ?? 'get'
      headers = (input.headers as Record<string, any>)['map']
      body = input.body
    } else if (input instanceof URL) {
      url = input.href
    } else {
      url = input
    }
    return this.server?.network({
      ...this.baseData,
      url,
      id: uniqueId,
      method,
      headers,
      body,
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
      requestId: uniqueId,
    })
  }

  async resResponseError(uniqueId: string) {
    return this.server?.network({
      ...this.baseData,
      isResponseError: true,
      requestId: uniqueId,
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