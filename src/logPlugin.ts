import Server from './server';
import Logger from '../packages/network-logger/Logger.ts';
import NetworkRequestInfo from '../packages/network-logger/NetworkRequestInfo.ts';
import { extractDomain } from './utils.ts';
import CompatibilityManager from './CompatibilityManager.ts';

class LogPlugin {
  private server: Server | null = null;
  private baseData: Record<string, any> = {};
  private timeout: number | null = null;
  private networkLogger = new Logger();
  private host = '';

  auto() {
    this.startRecordNetwork();
    this.networkLogger.enableXHRInterception({
      ignoredHosts: [extractDomain(this.host)],
    });
    this.startRecordLog();
  }

  startRecordLog() {
    import('./common').then((common) => {
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
    });
  }

  startRecordNetwork() {
    this.networkLogger.setCallback(async (data: NetworkRequestInfo[]) => {
      // log('network----', data);
      import('./common').then(({ log }) => {
        log('network----', JSON.stringify(data));
      })
      const sendDatas = await CompatibilityManager.interceptionToNetwork(data);
      sendDatas.forEach(e => {
        this.server?.network({
          ...this.baseData,
          ...e
        });
      })
    });
  }

  setBaseUrl(url: string) {
    this.host = url.includes("http") ? url : `http://${url}`;
    if (this.server) {
      this.server.updateUrl(url);
    } else {
      this.server = new Server(url);
    }
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  setTimeout(timeout: number) {
    if (typeof timeout === 'number') {
      this.timeout = timeout;
      this.server?.updateTimeout(this.timeout);
    }
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  getTimeout() {
    if (typeof this.timeout === 'number') {
      return this.timeout;
    }
    return null;
  }

  setBaseData(data: Record<string, any> = {}) {
    this.baseData = data;
  }

  private _log(level: string, tag: string, ...data: any[]) {
    const sendData = {
      ...this.baseData,
      message: data,
      tag,
      level: level ?? 'log',
      createTime: Date.now(),
    };
    this.server?.log(sendData);
  }

  tag(tag: string, ...data: any[]) {
    this._log('log', tag, ...data);
  }

  log(...data: any[]) {
    this._log('log', 'default', ...data);
  }

  warn(...data: any[]) {
    this._log('warn', 'default', ...data);
  }

  error(...data: any[]) {
    this._log('error', 'default', ...data);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  async uniqueReq(
    uniqueId: string | undefined,
    input: RequestInfo | URL,
    init?: RequestInit
  ) {
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

  private async _res(uniqueId?: string, id?: number, response?: Response) {
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
  async resTimeout(uniqueId: string) {
    return this.server?.network({
      ...this.baseData,
      isTimeout: true,
      requestId: uniqueId,
    });
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  async resResponseError(uniqueId: string) {
    return this.server?.network({
      ...this.baseData,
      isResponseError: true,
      requestId: uniqueId,
    });
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  async uniqueRes(uniqueId: string, response?: Response) {
    return this._res(uniqueId, undefined, response);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  async req(input: RequestInfo | URL, init?: RequestInit) {
    return this.uniqueReq(undefined, input, init);
  }

  /**
   * @deprecated 不需要手动上报，日志插件会自动收集日志
   */
  async res(id: number, response?: Response) {
    return this._res(undefined, id, response);
  }
}
const logPlugin = new LogPlugin();
export { LogPlugin };
export default logPlugin;
