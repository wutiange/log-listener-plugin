import Server from './Server';
import { createClassWithErrorHandling } from './utils';
import { httpInterceptor } from './HTTPInterceptor';
import { DEFAULT_TIMEOUT, getDefaultStorage, Level, LOG_KEY, Tag, URLS_KEY } from './common';
import logger from './logger';

type Options = {
  /**
   * storage 用于存储已设置的日志系统的 url
   * @default @react-native-async-storage/async-storage
   */
  storage?: Storage
  /**
   * 设置上传日志的超时时间，单位为毫秒
   * @default 3000
   */
  timeout?: number
  /**
   * 日志系统的url
   */
  testUrl?: string
  /**
   * 是否自动开启日志记录
   * @default false
   */
  isAuto?: boolean
  /**
   * 设置日志系统的基础数据，这些数据会自动添加到每条日志中
   */
  baseData?: Record<string, any>
}

class LogPlugin {
  private server: Server | null = null;
  private timeout: number | null = null;
  private isAuto = false
  private storage: Storage | null = getDefaultStorage();

  constructor() {
    this.init()
  }

  private init = async () => {
    this.server = new Server();

    if (this.storage) {
      const urlsStr = await this.storage.getItem(URLS_KEY)
      if (urlsStr) {
        const urls = JSON.parse(urlsStr)
        this.server.setBaseUrlArr(new Set(urls))
      }
    }

    
    this.server.addUrlsListener((urlArr) => {
      if (this.storage) {
        this.storage.setItem(URLS_KEY, JSON.stringify(urlArr))
      }
      httpInterceptor.setIgnoredUrls(this.handleIgnoredUrls())
    })
  }

  config = ({ storage, timeout, testUrl, isAuto, baseData = {} }: Options) => {
    if (isAuto) {
      this.auto()
    } else {
      this.unAuto()
    }
    this.storage = storage ?? getDefaultStorage();
    this.setTimeout(timeout ?? DEFAULT_TIMEOUT)
    this.setBaseUrl(testUrl)
    this.setBaseData(baseData)
  };

  /**
   * @deprecated 这个方法将在下一个主要版本中被移除。请使用 config({isAuto: true}) 替代。
   */
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
      this.log(...data);
      if (!__DEV__) {
        return
      }
      logger.log(...data)
    };

    console.warn = (...data: any[]) => {
      this.warn(...data);
      if (!__DEV__) {
        return
      }
      logger.warn(...data)
    };

    console.error = (...data: any[]) => {
      this.error(...data);
      if (!__DEV__) {
        return
      }
      logger.error(...data)
    };
  }

  stopRecordLog = () => {
    console.log = logger.log
    console.warn = logger.warn
    console.error = logger.error
  }

  private handleIgnoredUrls = () => {
    const urls = this.server?.getBaseUrlArr?.()
    const ignoredUrls: string[] = []
    if (urls?.size) {
      urls.forEach((url) => {
        ignoredUrls.push(`${url}/log`, `${url}/network`, `${url}/join`)
      })
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

  /**
   * @deprecated 这个方法将在下一个主要版本中被移除。请使用 config({testUrl: ''}) 替代。
   */
  setBaseUrl = (url: string) => {
    const tempUrl = url?.trim()
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

  /**
   * @deprecated 这个方法将在下一个主要版本中被移除。请使用 config({timeout: 3000}) 替代。
   */
  setTimeout = (timeout: number) => {
    if (typeof timeout === 'number') {
      this.timeout = timeout;
      this.server?.updateTimeout(this.timeout);
    }
  }

  /**
   * @deprecated 这个方法将在下一个主要版本中被移除。移除后将不再支持获取超时时间。
   */
  getTimeout = () => {
    if (typeof this.timeout === 'number') {
      return this.timeout;
    }
    return null;
  }

  /**
   * @deprecated 这个方法将在下一个主要版本中被移除。请使用 config({baseData: {}}) 替代。
   */
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
