import Server from './Server';
import { createClassWithErrorHandling } from './utils';
import { httpInterceptor } from './HTTPInterceptor';
import { getDefaultStorage, Level, LOG_KEY, Tag, URLS_KEY } from './common';
import logger from './logger';

class LogPlugin {
  private server: Server | null = null;
  private timeout: number | null = null;
  private isAuto = false
  private storage: Storage | null = getDefaultStorage();

  constructor() {
    this.init()
  }

  private init = async () => {
    if (!this.storage) {
      this.server = new Server();
      logger.warn(LOG_KEY, '你并没有设置 storage ，这会导致 App 杀死后可能需要重新加入日志系统才能收集日志数据，建议你设置 storage 。')
    } else {
      const urlsStr = await this.storage.getItem(URLS_KEY)
      if (urlsStr) {
        const urls = JSON.parse(urlsStr)
        this.server = new Server(urls);
      } else {
        this.server = new Server();
      }
    }

    
    this.server.addUrlsListener((_, urlsObj) => {
      if (this.storage) {
        this.storage.setItem(URLS_KEY, JSON.stringify(urlsObj))
      }
      httpInterceptor.setIgnoredUrls(this.handleIgnoredUrls())
    })
  }

  config = ({ storage }: { storage: Storage }) => {
    this.storage = storage;
  };

  auto = () => {
    this.startRecordNetwork();
    this.startRecordLog();
    this.isAuto = true
  }

  unAuto = () => {
    this.stopRecordLog()
    httpInterceptor.disable()
    httpInterceptor.removeAllListener()
    this.isAuto = false
  }

  startRecordLog = () => {
    console.log = (...data: any[]) => {
      logger.log(...data)
      this.log(...data);
    };

    console.warn = (...data: any[]) => {
      logger.warn(...data)
      this.warn(...data);
    };

    console.error = (...data: any[]) => {
      logger.error(...data)
      this.error(...data);
    };
  }

  stopRecordLog = () => {
    console.log = logger.log
    console.warn = logger.warn
    console.error = logger.error
  }

  private handleIgnoredUrls = () => {
    const urls = this.server?.getUrls?.()
    let ignoredUrls: string[] = []
    if (urls?.length) {
      ignoredUrls = urls.reduce((acc, url) => {
        acc.push(`${url}/log`, `${url}/network`, `${url}/join`)
        return acc
      }, [] as string[])
    }
    return ignoredUrls
  }

  startRecordNetwork = () => {
    httpInterceptor.addListener("send", (data) => {
      this.server?.network({
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
        headers: data.responseHeaders,
        body: data.responseData,
        requestId: data.id,
        statusCode: data.status,
        endTime: data.endTime
      })
    })
    httpInterceptor.enable({ignoredUrls: this.handleIgnoredUrls()})
  }

  setBaseUrl = (url: string) => {
    const tempUrl = url?.trim()
    if (!tempUrl) {
      return
    }
    if (this.server) {
      this.server.updateUrl(tempUrl);
    } else {
      this.server = new Server(tempUrl);
    }
    httpInterceptor.setIgnoredUrls(this.handleIgnoredUrls())
    if (this.isAuto) {
      this.startRecordNetwork();
      this.startRecordLog()
    }
  }

  setTimeout = (timeout: number) => {
    if (typeof timeout === 'number') {
      this.timeout = timeout;
      this.server?.updateTimeout(this.timeout);
    }
  }

  getTimeout = () => {
    if (typeof this.timeout === 'number') {
      return this.timeout;
    }
    return null;
  }

  setBaseData = (data: Record<string, any> = {}) => {
    this.server.updateBaseData(data)
  }

  private _log = (level: string, tag: string, ...data: any[]) => {
    const sendData = {
      message: data,
      tag,
      level: level ?? 'log',
      createTime: Date.now(),
    };
    this.server?.log(sendData);
  }

  tag = (tag: string, ...data: any[]) => {
    this._log(Level.LOG, tag, ...data);
  }

  log = (...data: any[]) => {
    this._log(Level.LOG, Tag.DEFAULT, ...data);
  }

  warn = (...data: any[]) => {
    this._log(Level.WARN, Tag.DEFAULT, ...data);
  }

  error = (...data: any[]) => {
    this._log(Level.ERROR, Tag.DEFAULT, ...data);
  }

}
const SafeLogPlugin = createClassWithErrorHandling(LogPlugin)
const logPlugin = new SafeLogPlugin();
export { SafeLogPlugin };
export default logPlugin;
