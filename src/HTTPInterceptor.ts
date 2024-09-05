// @ts-ignore
import XHRInterceptor from 'react-native/Libraries/Network/XHRInterceptor';
// @ts-ignore
import BlobFileReader from 'react-native/Libraries/Blob/FileReader';

type StartNetworkLoggingOptions = {
  /** List of hosts to ignore, e.g. `services.test.com` */
  ignoredHosts?: string[];
  /** List of urls to ignore, e.g. `https://services.test.com/test` */
  ignoredUrls?: string[];
  /**
   * List of url patterns to ignore, e.g. `/^GET https://test.com\/pages\/.*$/`
   *
   * Url to match with is in the format: `${method} ${url}`, e.g. `GET https://test.com/pages/123`
   */
  ignoredPatterns?: RegExp[];
  /**
   * Force the network logger to start even if another program is using the network interceptor
   * e.g. a dev/debuging program
   */
  forceEnable?: boolean;
};

interface HttpRequestInfo {
  id: string;
  method: RequestMethod;
  url: string;
  timeout: number;
  requestHeaders: Record<string, string>;
  requestData: string;
  startTime: number;
  endTime: number;
  responseHeaders: Headers;
  responseData: string;
  status: number;
  duration: number;
  responseContentType: string;
  responseSize: number;
  responseURL: string;
  responseType: string;
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type XHR = {
  uniqueId: string;
  responseHeaders?: Headers;
};

type EventName =
  | 'open'
  | 'requestHeader'
  | 'headerReceived'
  | 'send'
  | 'response';

const extractHost = (url: string) => {
  const host = url.split('//')[1]?.split(':')[0]?.split('/')[0] || undefined;

  return host;
};

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const parseResponseBlob = async (response: string) => {
  const blobReader = new BlobFileReader();
  blobReader.readAsText(response);

  return await new Promise<string>((resolve, reject) => {
    const handleError = () => reject(blobReader.error);

    blobReader.addEventListener('load', () => {
      resolve(blobReader.result);
    });
    blobReader.addEventListener('error', handleError);
    blobReader.addEventListener('abort', handleError);
  });
}

const getResponseBody = async (responseType: string, response: string) => {
  try {
    const body = await (responseType !== 'blob'
      ? response
      : parseResponseBlob(response));
    return JSON.parse(body)
  } catch (error) {
    return null
  }
}

class HTTPInterceptor {
  private static _index = 0;
  private ignoredHosts: Set<string> | undefined;
  private ignoredUrls: Set<string> | undefined;
  private ignoredPatterns: RegExp[] | undefined;
  // 只保存正在请求中的
  private allRequests = new Map<string, Partial<HttpRequestInfo>>();

  private userListeners: [
    EventName,
    (data: Partial<HttpRequestInfo>) => Promise<void> | void,
  ][] = [];

  private enabled = false;

  addListener = (
    eventName: EventName,
    listener: (data: Partial<HttpRequestInfo>) => Promise<void> | void,
  ) => {
    // 如果之前已经订阅过了就过滤掉
    if (
      this.userListeners.find(
        ([name, tempListener]) =>
          name === eventName && tempListener === listener,
      )
    ) {
      return;
    }
    this.userListeners.push([eventName, listener]);

    return () => {
      this.userListeners = this.userListeners.filter(
        ([name, tempListener]) =>
          name !== eventName || tempListener !== listener,
      );
    };
  };

  removeListener = (
    eventName: EventName,
    listener: (data: Partial<HttpRequestInfo>) => Promise<void> | void,
  ) => {
    this.userListeners = this.userListeners.filter(
      ([name, tempListener]) => name !== eventName || tempListener !== listener,
    );
  };

  removeAllListener() {
    this.userListeners = [];
  }

  private listenerHandle = (
    eventName: EventName,
    data: Partial<HttpRequestInfo>,
  ) => {
    this.userListeners.forEach(async ([name, listener]) => {
      if (name === eventName) {
        await listener(data);
      }
    });
  };

  

  private openHandle = (method: RequestMethod, url: string, xhr: XHR) => {
    if (this.ignoredHosts) {
      const host = extractHost(url);
      if (host && this.ignoredHosts.has(host)) {
        return;
      }
    }
    if (this.ignoredUrls && this.ignoredUrls.has(url)) {
      return;
    }

    if (this.ignoredPatterns) {
      if (
        this.ignoredPatterns.some(pattern => pattern.test(`${method} ${url}`))
      ) {
        return;
      }
    }
    xhr.uniqueId = HTTPInterceptor._index + generateUniqueId();
    const newRequest = {
      id: xhr.uniqueId,
      method,
      url,
    };
    this.allRequests.set(xhr.uniqueId, newRequest);
    this.listenerHandle('open', newRequest);
  };

  private requestHeaderHandle = (header: string, value: string, xhr: XHR) => {
    const currentRequest = this.allRequests.get(xhr.uniqueId);
    if (!currentRequest) {
      return;
    }
    if (!currentRequest.requestHeaders) {
      currentRequest.requestHeaders = {};
    }
    currentRequest.requestHeaders[header] = value;
    this.listenerHandle('requestHeader', currentRequest);
  };

  private headerReceivedHandle = (
    responseContentType: string,
    responseSize: number,
    responseHeaders: Headers,
    xhr: XHR,
  ) => {
    const currentRequest = this.allRequests.get(xhr.uniqueId);
    if (!currentRequest) {
      return;
    }
    currentRequest.responseContentType = responseContentType;
    currentRequest.responseSize = responseSize;
    currentRequest.responseHeaders = xhr.responseHeaders;
    this.listenerHandle('headerReceived', currentRequest);
  };

  private responseHandle = async (
    status: number,
    timeout: number,
    response: string,
    responseURL: string,
    responseType: string,
    xhr: XHR,
  ) => {
    const currentRequest = this.allRequests.get(xhr.uniqueId);
    if (!currentRequest) {
      return;
    }
    currentRequest.endTime = Date.now();
    currentRequest.status = status;
    currentRequest.timeout = timeout;
    currentRequest.responseData = await getResponseBody(responseType, response);
    currentRequest.responseURL = responseURL;
    currentRequest.responseType = responseType;
    currentRequest.duration =
      currentRequest.endTime - (currentRequest.startTime ?? 0);
    this.listenerHandle('response', currentRequest);
    this.allRequests.delete(xhr.uniqueId);
  };

  private sendHandle = (data: string, xhr: XHR) => {
    const currentRequest = this.allRequests.get(xhr.uniqueId);
    if (!currentRequest) {
      return;
    }
    try {
      currentRequest.requestData = JSON.parse(data);
    } catch (error) {
      currentRequest.requestData = null;
    }
    currentRequest.startTime = Date.now();
    this.listenerHandle('send', currentRequest);
  };

  enable = (options?: StartNetworkLoggingOptions) => {
    try {
      if (
        this.enabled ||
        (XHRInterceptor.isInterceptorEnabled() && !options?.forceEnable)
      ) {
        if (!this.enabled) {
          console.warn(
            'network interceptor has not been enabled as another interceptor is already running (e.g. another debugging program). Use option `forceEnable: true` to override this behaviour.',
          );
        }
        return;
      }

      if (options?.ignoredHosts) {
        if (
          !Array.isArray(options.ignoredHosts) ||
          typeof options.ignoredHosts[0] !== 'string'
        ) {
          console.warn(
            'ignoredHosts must be an array of strings. The logger has not been started.',
          );
          return;
        }
        this.ignoredHosts = new Set(options.ignoredHosts);
      }

      if (options?.ignoredPatterns) {
        this.ignoredPatterns = options.ignoredPatterns;
      }

      if (options?.ignoredUrls) {
        if (
          !Array.isArray(options.ignoredUrls) ||
          typeof options.ignoredUrls[0] !== 'string'
        ) {
          console.warn(
            'ignoredUrls must be an array of strings. The logger has not been started.',
          );
          return;
        }
        this.ignoredUrls = new Set(options.ignoredUrls);
      }
      XHRInterceptor.setOpenCallback(this.openHandle);
      XHRInterceptor.setRequestHeaderCallback(this.requestHeaderHandle);
      XHRInterceptor.setHeaderReceivedCallback(this.headerReceivedHandle);
      XHRInterceptor.setSendCallback(this.sendHandle);
      XHRInterceptor.setResponseCallback(this.responseHandle);
      XHRInterceptor.enableInterception();
      this.enabled = true;
    } catch (error) {}
  };

  disable = () => {
    if (!this.enabled) {
      return;
    }
    XHRInterceptor.disableInterception();
    this.enabled = false;
  }
}

const httpInterceptor = new HTTPInterceptor();
export {
  type StartNetworkLoggingOptions,
  httpInterceptor,
  type EventName,
  type RequestMethod,
};
