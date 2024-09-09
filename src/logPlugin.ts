import Server from './Server';
import { createClassWithErrorHandling } from './utils';
import { httpInterceptor } from './HTTPInterceptor';

class LogPlugin {
  private server: Server | null = null;
  private baseData: Record<string, any> = {};
  private timeout: number | null = null;
  private host = '';
  private isAuto = false

  auto = () => {
    if (this.host) {
      this.startRecordNetwork();
      this.startRecordLog();
    }
    this.isAuto = true
  }

  unAuto = () => {
    this.stopRecordLog()
    httpInterceptor.disable()
    httpInterceptor.removeAllListener()
    this.isAuto = false
  }

  startRecordLog = () => {
    const common = require('./common')
    console.log = (...data: any[]) => {
      this.log(...data);
      common.log(...data);
    };

    console.warn = (...data: any[]) => {
      this.warn(...data);
      common.warn(...data);
    };

    console.error = (...data: any[]) => {
      this.error(...data);
      common.error(...data);
    };
  }

  stopRecordLog = () => {
    const common = require('./common')
    console.log = common.log
    console.warn = common.warn
    console.error = common.error
  }

  startRecordNetwork = () => {
    httpInterceptor.addListener("send", (data) => {
      this.server?.network({
        ...this.baseData,
        url: data.url,
        id: data.id,
        method: data.method,
        headers: data.requestHeaders,
        body: data.requestData,
        createTime: data.startTime
      })
    })
    httpInterceptor.addListener("response", (data) => {
      this.server?.network({
        ...this.baseData,
        headers: data.responseHeaders,
        body: data.responseData,
        requestId: data.id,
        statusCode: data.status,
        endTime: data.endTime
      })
    })
    const url = this.server?.getUrl?.()
    let ignoredUrls: string[] = []
    if (url) {
      ignoredUrls = [`${url}/log`, `${url}/network`]
    }
    httpInterceptor.enable({ignoredUrls})
  }

  setBaseUrl = (url: string) => {
    if (!url?.trim()) {
      httpInterceptor.disable()
      this.stopRecordLog()
      return
    }
    this.host = url.includes("http") ? url : `http://${url}`;
    if (this.server) {
      this.server.updateUrl(url);
    } else {
      this.server = new Server(url);
    }
    if (this.isAuto) {
      this.startRecordNetwork();
      this.startRecordLog()
    }
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  setTimeout = (timeout: number) => {
    if (typeof timeout === 'number') {
      this.timeout = timeout;
      this.server?.updateTimeout(this.timeout);
    }
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  getTimeout = () => {
    if (typeof this.timeout === 'number') {
      return this.timeout;
    }
    return null;
  }

  setBaseData = (data: Record<string, any> = {}) => {
    this.baseData = data;
  }

  private _log = (level: string, tag: string, ...data: any[]) => {
    const sendData = {
      ...this.baseData,
      message: data,
      tag,
      level: level ?? 'log',
      createTime: Date.now(),
    };
    this.server?.log(sendData);
  }

  tag = (tag: string, ...data: any[]) => {
    this._log('log', tag, ...data);
  }

  log = (...data: any[]) => {
    this._log('log', 'default', ...data);
  }

  warn = (...data: any[]) => {
    this._log('warn', 'default', ...data);
  }

  error = (...data: any[]) => {
    this._log('error', 'default', ...data);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  uniqueReq = async (
    uniqueId: string | undefined,
    input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    let url: string | null = null;
    let method = init?.method ?? 'get';
    let headers = init?.headers;
    let body = init?.body;
    if (input instanceof Request) {
      url = input.url;
      method = input.method ?? 'get';
      headers = (input.headers as Record<string, any>).map;
      body = input.body;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input;
    }
    return this.server?.network({
      ...this.baseData,
      url,
      id: uniqueId,
      method,
      headers,
      body,
      createTime: Date.now(),
    });
  }

  private _res = async (uniqueId?: string, id?: number, response?: Response) => {
    const body = await response?.text();
    return this.server?.network({
      ...this.baseData,
      headers: (response?.headers as Record<string, any>).map,
      body,
      requestId: uniqueId ?? Number(id),
      statusCode: response?.status,
      endTime: Date.now(),
    });
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  resTimeout = async (uniqueId: string) => {
    return this.server?.network({
      ...this.baseData,
      isTimeout: true,
      requestId: uniqueId,
    });
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  resResponseError = async (uniqueId: string) => {
    return this.server?.network({
      ...this.baseData,
      isResponseError: true,
      requestId: uniqueId,
    });
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  uniqueRes = async (uniqueId: string, response?: Response) => {
    return this._res(uniqueId, undefined, response);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  req = async (input: RequestInfo | URL, init?: RequestInit) => {
    return this.uniqueReq(undefined, input, init);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  res = async (id: number, response?: Response) => {
    return this._res(undefined, id, response);
  }
}
const SafeLogPlugin = createClassWithErrorHandling(LogPlugin)
const logPlugin = new SafeLogPlugin();
export { SafeLogPlugin };
export default logPlugin;
