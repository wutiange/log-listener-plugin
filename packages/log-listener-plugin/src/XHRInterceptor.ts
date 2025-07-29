import logger from './logger';
import XMLHttpRequest from './XMLHttpRequest';

const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;
const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

type OpenCallback = (method: string, url: string, xhr: XMLHttpRequest) => void;
type SendCallback = (data: any, xhr: XMLHttpRequest) => void;
type RequestHeaderCallback = (
  header: string,
  value: string,
  xhr: XMLHttpRequest,
) => void;
type HeaderReceivedCallback = (
  responseContentType: string | undefined,
  responseSize: number | undefined,
  allResponseHeaders: string | null,
  xhr: XMLHttpRequest,
) => void;
type ResponseCallback = (
  status: number,
  timeout: number,
  response: any,
  responseURL: string | null,
  responseType: string,
  xhr: XMLHttpRequest,
) => void;

let openCallback: OpenCallback | undefined;
let sendCallback: SendCallback | undefined;
let requestHeaderCallback: RequestHeaderCallback | undefined;
let headerReceivedCallback: HeaderReceivedCallback | undefined;
let responseCallback: ResponseCallback | undefined;

let isInterceptorEnabled = false;

/**
 * A network interceptor which monkey-patches XMLHttpRequest methods
 * to gather all network requests/responses, in order to show their
 * information in the React Native inspector development tool.
 * This supports interception with XMLHttpRequest API, including Fetch API
 * and any other third party libraries that depend on XMLHttpRequest.
 */
const XHRInterceptor = {
  /**
   * Invoked before XMLHttpRequest.open(...) is called.
   */
  setOpenCallback(callback: OpenCallback) {
    openCallback = callback;
  },

  /**
   * Invoked before XMLHttpRequest.send(...) is called.
   */
  setSendCallback(callback: SendCallback) {
    sendCallback = callback;
  },

  /**
   * Invoked after xhr's readyState becomes xhr.HEADERS_RECEIVED.
   */
  setHeaderReceivedCallback(callback: HeaderReceivedCallback) {
    headerReceivedCallback = callback;
  },

  /**
   * Invoked after xhr's readyState becomes xhr.DONE.
   */
  setResponseCallback(callback: ResponseCallback) {
    responseCallback = callback;
  },

  /**
   * Invoked before XMLHttpRequest.setRequestHeader(...) is called.
   */
  setRequestHeaderCallback(callback: RequestHeaderCallback) {
    requestHeaderCallback = callback;
  },

  isInterceptorEnabled(): boolean {
    return isInterceptorEnabled;
  },

  enableInterception(): void {
    if (isInterceptorEnabled) {
      return;
    }
    // Override `open` method for all XHR requests to intercept the request
    // method and url, then pass them through the `openCallback`.
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      ...args: any[]
    ) {
      logger.log('open', args);
      if (openCallback) {
        openCallback(args[0], args[1].toString(), this);
      }
      (originalXHROpen as any).apply(this, args);
    };

    // Override `setRequestHeader` method for all XHR requests to intercept
    // the request headers, then pass them through the `requestHeaderCallback`.
    XMLHttpRequest.prototype.setRequestHeader = function (
      this: XMLHttpRequest,
      ...args: any[]
    ) {
      if (requestHeaderCallback) {
        requestHeaderCallback(args[0], args[1], this);
      }
      (originalXHRSetRequestHeader as any).apply(this, args);
    };

    // Override `send` method of all XHR requests to intercept the data sent,
    // register listeners to intercept the response, and invoke the callbacks.
    XMLHttpRequest.prototype.send = function (
      this: XMLHttpRequest,
      ...args: any[]
    ) {
      if (sendCallback) {
        sendCallback(args[0], this);
      }
      if (this.addEventListener) {
        this.addEventListener(
          'readystatechange',
          () => {
            if (!isInterceptorEnabled) {
              return;
            }
            if (this.readyState === this.DONE) {
              if (responseCallback) {
                responseCallback(
                  this.status,
                  this.timeout,
                  this.response,
                  this.responseURL,
                  this.responseType,
                  this,
                );
              }
            } else if (this.readyState === this.HEADERS_RECEIVED) {
              const contentTypeString = this.getResponseHeader('Content-Type');
              const contentLengthString =
                this.getResponseHeader('Content-Length');
              let responseContentType: string | undefined;
              let responseSize: number | undefined;
              if (contentTypeString) {
                responseContentType = contentTypeString.split(';')[0];
              }
              if (contentLengthString) {
                responseSize = parseInt(contentLengthString, 10);
              }
              if (headerReceivedCallback) {
                headerReceivedCallback(
                  responseContentType,
                  responseSize,
                  this.getAllResponseHeaders(),
                  this,
                );
              }
            }
          },
          // false,
        );
      }
      (originalXHRSend as any).apply(this, args);
    };
    isInterceptorEnabled = true;
  },

  // Unpatch XMLHttpRequest methods and remove the callbacks.
  disableInterception(): void {
    if (!isInterceptorEnabled) {
      return;
    }
    isInterceptorEnabled = false;
    XMLHttpRequest.prototype.send = originalXHRSend;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
    responseCallback = undefined;
    openCallback = undefined;
    sendCallback = undefined;
    headerReceivedCallback = undefined;
    requestHeaderCallback = undefined;
  },
};

export default XHRInterceptor;
