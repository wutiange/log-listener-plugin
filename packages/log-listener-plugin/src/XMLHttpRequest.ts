import type { IPerformanceLogger } from 'react-native/Libraries/Utilities/createPerformanceLogger';
import { type EventSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';
import EventTarget from 'event-target-shim';

import BlobManager from 'react-native/Libraries/Blob/BlobManager';
import GlobalPerformanceLogger from 'react-native/Libraries/Utilities/GlobalPerformanceLogger';
import RCTNetworking from 'react-native/Libraries/Network/RCTNetworking';
import * as base64 from 'base64-js';
import invariant from 'invariant';
import logger from './logger';

const DEBUG_NETWORK_SEND_DELAY: false = false; // Set to a number of milliseconds when debugging

export type NativeResponseType = 'base64' | 'blob' | 'text';
export type ResponseType =
  | ''
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text';
export type Response = Record<string, any> | string | null;

// The native blob module is optional so inject it here if available.
if (BlobManager.isAvailable) {
  BlobManager.addNetworkingHandler();
}

interface XHRInterceptor {
  requestSent(id: number, url: string, method: string, headers: object): void;
  responseReceived(
    id: number,
    url: string,
    status: number,
    headers: object,
  ): void;
  dataReceived(id: number, data: string): void;
  loadingFinished(id: number, encodedDataLength: number): void;
  loadingFailed(id: number, error: string): void;
}

const UNSENT = 0;
const OPENED = 1;
const HEADERS_RECEIVED = 2;
const LOADING = 3;
const DONE = 4;

const SUPPORTED_RESPONSE_TYPES = {
  arraybuffer: typeof global.ArrayBuffer === 'function',
  blob: typeof global.Blob === 'function',
  document: false,
  json: true,
  text: true,
  '': true,
};

class XMLHttpRequestEventTarget extends EventTarget {
  onload: ((event: Event) => void) | null = null;
  onloadstart: ((event: Event) => void) | null = null;
  onprogress: ((event: ProgressEvent) => void) | null = null;
  ontimeout: ((event: ProgressEvent) => void) | null = null;
  onerror: ((event: ProgressEvent) => void) | null = null;
  onabort: ((event: Event) => void) | null = null;
  onloadend: ((event: ProgressEvent) => void) | null = null;
}

/**
 * Shared base for platform-specific XMLHttpRequest implementations.
 */
class XMLHttpRequest extends EventTarget {
  static UNSENT: number = UNSENT;
  static OPENED: number = OPENED;
  static HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  static LOADING: number = LOADING;
  static DONE: number = DONE;

  static _interceptor: XHRInterceptor | null = null;

  UNSENT: number = UNSENT;
  OPENED: number = OPENED;
  HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  LOADING: number = LOADING;
  DONE: number = DONE;

  // EventTarget automatically initializes these to `null`.
  onload: ((event: Event) => void) | null = null;
  onloadstart: ((event: Event) => void) | null = null;
  onprogress: ((event: ProgressEvent) => void) | null = null;
  ontimeout: ((event: ProgressEvent) => void) | null = null;
  onerror: ((event: ProgressEvent) => void) | null = null;
  onabort: ((event: Event) => void) | null = null;
  onloadend: ((event: ProgressEvent) => void) | null = null;
  onreadystatechange: ((event: Event) => void) | null = null;

  readyState: number = UNSENT;
  responseHeaders: Record<string, any> | null | undefined;
  status: number = 0;
  timeout: number = 0;
  responseURL: string | null = null;
  withCredentials: boolean = true;

  upload: XMLHttpRequestEventTarget = new XMLHttpRequestEventTarget();

  _requestId: number | null = null;
  _subscriptions: EventSubscription[] = [];

  _aborted: boolean = false;
  _cachedResponse: Response | undefined;
  _hasError: boolean = false;
  _headers: Record<string, string> = {};
  _lowerCaseResponseHeaders: Record<string, string> = {};
  _method: string | null = null;
  _perfKey: string | null = null;
  _responseType: ResponseType = '';
  _response: string = '';
  _sent: boolean = false;
  _url: string | null = null;
  _timedOut: boolean = false;
  _trackingName: string = 'unknown';
  _incrementalEvents: boolean = false;
  _performanceLogger: IPerformanceLogger = GlobalPerformanceLogger;

  static setInterceptor(interceptor: XHRInterceptor | null) {
    XMLHttpRequest._interceptor = interceptor;
  }

  constructor() {
    super();
    this._reset();
  }

  _reset(): void {
    this.readyState = this.UNSENT;
    this.responseHeaders = undefined;
    this.status = 0;
    this.responseURL = null;

    this._requestId = null;

    this._cachedResponse = undefined;
    this._hasError = false;
    this._headers = {};
    this._response = '';
    this._responseType = '';
    this._sent = false;
    this._lowerCaseResponseHeaders = {};

    this._clearSubscriptions();
    this._timedOut = false;
  }

  get responseType(): ResponseType {
    return this._responseType;
  }

  set responseType(responseType: ResponseType) {
    if (this._sent) {
      throw new Error(
        "Failed to set the 'responseType' property on 'XMLHttpRequest': The " +
          'response type cannot be set after the request has been sent.',
      );
    }
    if (!(responseType in SUPPORTED_RESPONSE_TYPES)) {
      console.warn(
        `The provided value '${responseType}' is not a valid 'responseType'.`,
      );
      return;
    }

    // redboxes early, e.g. for 'arraybuffer' on ios 7
    invariant(
      SUPPORTED_RESPONSE_TYPES[responseType] || responseType === 'document',
      `The provided value '${responseType}' is unsupported in this environment.`,
    );

    if (responseType === 'blob') {
      invariant(
        BlobManager.isAvailable,
        'Native module BlobModule is required for blob support',
      );
    }
    this._responseType = responseType;
  }

  get responseText(): string {
    if (this._responseType !== '' && this._responseType !== 'text') {
      throw new Error(
        "The 'responseText' property is only available if 'responseType' " +
          `is set to '' or 'text', but it is '${this._responseType}'.`,
      );
    }
    if (this.readyState < LOADING) {
      return '';
    }
    return this._response;
  }

  get response(): Response | null {
    const { responseType } = this;
    if (responseType === '' || responseType === 'text') {
      return this.readyState < LOADING || this._hasError ? '' : this._response;
    }

    if (this.readyState !== DONE) {
      return null;
    }

    if (this._cachedResponse !== undefined) {
      return this._cachedResponse;
    }

    switch (responseType) {
      case 'document':
        this._cachedResponse = null;
        break;

      case 'arraybuffer':
        this._cachedResponse = base64.toByteArray(this._response).buffer;
        break;

      case 'blob':
        if (typeof this._response === 'object' && this._response) {
          this._cachedResponse = BlobManager.createFromOptions(this._response);
        } else if (this._response === '') {
          this._cachedResponse = BlobManager.createFromParts([]);
        } else {
          throw new Error(
            'Invalid response for blob - expecting object, was ' +
              `${typeof this._response}: ${this._response.trim()}`,
          );
        }
        break;

      case 'json':
        try {
          this._cachedResponse = JSON.parse(this._response);
        } catch (_) {
          this._cachedResponse = null;
        }
        break;

      default:
        this._cachedResponse = null;
    }

    return this._cachedResponse ?? null;
  }

  // exposed for testing
  __didCreateRequest(requestId: number): void {
    this._requestId = requestId;

    XMLHttpRequest._interceptor?.requestSent(
      requestId,
      this._url || '',
      this._method || 'GET',
      this._headers,
    );
  }

  // exposed for testing
  __didUploadProgress(
    requestId: number,
    progress: number,
    total: number,
  ): void {
    if (requestId === this._requestId) {
      this.upload.dispatchEvent(
        new ProgressEvent('progress', {
          bubbles: false,
          cancelable: false,
          lengthComputable: true,
          loaded: progress,
          total,
        }),
      );
    }
  }

  __didReceiveResponse(
    requestId: number,
    status: number,
    responseHeaders: Record<string, any> | null,
    responseURL: string | null,
  ): void {
    if (requestId === this._requestId) {
      if (this._perfKey != null) {
        this._performanceLogger.stopTimespan(this._perfKey);
      }
      this.status = status;
      this.setResponseHeaders(responseHeaders);
      this.setReadyState(HEADERS_RECEIVED);
      if (responseURL || responseURL === '') {
        this.responseURL = responseURL;
      } else {
        this.responseURL = null;
      }

      XMLHttpRequest._interceptor?.responseReceived(
        requestId,
        responseURL || this._url || '',
        status,
        responseHeaders || {},
      );
    }
  }

  __didReceiveData(requestId: number, response: string): void {
    if (requestId !== this._requestId) {
      return;
    }
    this._response = response;
    this._cachedResponse = undefined; // force lazy recomputation
    this.setReadyState(LOADING);

    XMLHttpRequest._interceptor?.dataReceived(requestId, response);
  }

  __didReceiveIncrementalData(
    requestId: number,
    responseText: string,
    progress: number,
    total: number,
  ) {
    if (requestId !== this._requestId) {
      return;
    }
    if (!this._response) {
      this._response = responseText;
    } else {
      this._response += responseText;
    }

    XMLHttpRequest._interceptor?.dataReceived(requestId, responseText);

    this.setReadyState(LOADING);
    this.__didReceiveDataProgress(requestId, progress, total);
  }

  __didReceiveDataProgress(
    requestId: number,
    loaded: number,
    total: number,
  ): void {
    if (requestId !== this._requestId) {
      return;
    }
    this.dispatchEvent(
      new ProgressEvent('progress', {
        bubbles: false,
        cancelable: false,
        lengthComputable: total >= 0,
        loaded,
        total,
      }),
    );
  }

  // exposed for testing
  __didCompleteResponse(
    requestId: number,
    error: string,
    timeOutError: boolean,
  ): void {
    if (requestId === this._requestId) {
      if (error) {
        if (this._responseType === '' || this._responseType === 'text') {
          this._response = error;
        }
        this._hasError = true;
        if (timeOutError) {
          this._timedOut = true;
        }
      }
      this._clearSubscriptions();
      this._requestId = null;
      this.setReadyState(DONE);

      if (error) {
        XMLHttpRequest._interceptor?.loadingFailed(requestId, error);
      } else {
        XMLHttpRequest._interceptor?.loadingFinished(
          requestId,
          this._response.length,
        );
      }
    }
  }

  _clearSubscriptions(): void {
    (this._subscriptions || []).forEach((sub) => {
      if (sub) {
        sub.remove();
      }
    });
    this._subscriptions = [];
  }

  getAllResponseHeaders(): string | null {
    if (!this.responseHeaders) {
      // according to the spec, return null if no response has been received
      return null;
    }

    // Assign to non-nullable local variable.
    const responseHeaders = this.responseHeaders;

    const unsortedHeaders: Map<
      string,
      { lowerHeaderName: string; upperHeaderName: string; headerValue: string }
    > = new Map();
    for (const rawHeaderName of Object.keys(responseHeaders)) {
      const headerValue = responseHeaders[rawHeaderName];
      const lowerHeaderName = rawHeaderName.toLowerCase();
      const header = unsortedHeaders.get(lowerHeaderName);
      if (header) {
        header.headerValue += ', ' + headerValue;
        unsortedHeaders.set(lowerHeaderName, header);
      } else {
        unsortedHeaders.set(lowerHeaderName, {
          lowerHeaderName,
          upperHeaderName: rawHeaderName.toUpperCase(),
          headerValue,
        });
      }
    }

    // Sort in ascending order, with a being less than b if a's name is legacy-uppercased-byte less than b's name.
    const sortedHeaders = [...unsortedHeaders.values()].sort((a, b) => {
      if (a.upperHeaderName < b.upperHeaderName) {
        return -1;
      }
      if (a.upperHeaderName > b.upperHeaderName) {
        return 1;
      }
      return 0;
    });

    // Combine into single text response.
    return (
      sortedHeaders
        .map((header) => {
          return header.lowerHeaderName + ': ' + header.headerValue;
        })
        .join('\r\n') + '\r\n'
    );
  }

  getResponseHeader(header: string): string | null {
    const value = this._lowerCaseResponseHeaders[header.toLowerCase()];
    return value !== undefined ? value : null;
  }

  setRequestHeader(header: string, value: any): void {
    if (this.readyState !== OPENED) {
      throw new Error('Request has not been opened');
    }
    this._headers[header.toLowerCase()] = String(value);
  }

  /**
   * Custom extension for tracking origins of request.
   */
  setTrackingName(trackingName: string): XMLHttpRequest {
    this._trackingName = trackingName;
    return this;
  }

  /**
   * Custom extension for setting a custom performance logger
   */
  setPerformanceLogger(performanceLogger: IPerformanceLogger): XMLHttpRequest {
    this._performanceLogger = performanceLogger;
    return this;
  }

  open(method: string, url: string, async: boolean = true): void {
    logger.log('open XMLHttpRequest', method, url, async);
    /* Other optional arguments are not supported yet */
    if (this.readyState !== UNSENT) {
      throw new Error('Cannot open, already sending');
    }
    if (async !== undefined && !async) {
      // async is default
      throw new Error('Synchronous http requests are not supported');
    }
    if (!url) {
      throw new Error('Cannot load an empty url');
    }
    this._method = method.toUpperCase();
    this._url = url;
    this._aborted = false;
    this.setReadyState(OPENED);
  }

  send(data: any): void {
    if (this.readyState !== OPENED) {
      throw new Error('Request has not been opened');
    }
    if (this._sent) {
      throw new Error('Request has already been sent');
    }
    this._sent = true;
    const incrementalEvents =
      this._incrementalEvents || !!this.onreadystatechange || !!this.onprogress;

    this._subscriptions.push(
      RCTNetworking.addListener(
        'didSendNetworkData',
        (requestId: number, progress: number, total: number) =>
          this.__didUploadProgress(requestId, progress, total),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener(
        'didReceiveNetworkResponse',
        (
          requestId: number,
          status: number,
          responseHeaders: Record<string, any> | null,
          responseURL: string | null,
        ) =>
          this.__didReceiveResponse(
            requestId,
            status,
            responseHeaders,
            responseURL,
          ),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener(
        'didReceiveNetworkData',
        (requestId: number, response: string) =>
          this.__didReceiveData(requestId, response),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener(
        'didReceiveNetworkIncrementalData',
        (
          requestId: number,
          responseText: string,
          progress: number,
          total: number,
        ) =>
          this.__didReceiveIncrementalData(
            requestId,
            responseText,
            progress,
            total,
          ),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener(
        'didReceiveNetworkDataProgress',
        (requestId: number, loaded: number, total: number) =>
          this.__didReceiveDataProgress(requestId, loaded, total),
      ),
    );
    this._subscriptions.push(
      RCTNetworking.addListener(
        'didCompleteNetworkResponse',
        (requestId: number, error: string, timeOutError: boolean) =>
          this.__didCompleteResponse(requestId, error, timeOutError),
      ),
    );

    let nativeResponseType: NativeResponseType = 'text';
    if (this._responseType === 'arraybuffer') {
      nativeResponseType = 'base64';
    }
    if (this._responseType === 'blob') {
      nativeResponseType = 'blob';
    }

    const doSend = () => {
      const friendlyName =
        this._trackingName !== 'unknown' ? this._url : this._trackingName;
      this._perfKey = 'network_XMLHttpRequest_' + String(friendlyName);
      if (this._perfKey) {
        this._performanceLogger.startTimespan(this._perfKey);
      }
      invariant(
        this._method,
        'XMLHttpRequest method needs to be defined (%s).',
        friendlyName,
      );
      invariant(
        this._url,
        'XMLHttpRequest URL needs to be defined (%s).',
        friendlyName,
      );
      RCTNetworking.sendRequest(
        this._method,
        this._trackingName,
        this._url,
        this._headers,
        data,
        nativeResponseType,
        incrementalEvents,
        this.timeout,
        this.__didCreateRequest.bind(this),
        this.withCredentials,
      );
    };
    if (DEBUG_NETWORK_SEND_DELAY) {
      setTimeout(doSend, DEBUG_NETWORK_SEND_DELAY);
    } else {
      doSend();
    }
  }

  abort(): void {
    this._aborted = true;
    if (this._requestId) {
      RCTNetworking.abortRequest(this._requestId);
    }
    // only call onreadystatechange if there is something to abort,
    // below logic is per spec
    if (
      !(
        this.readyState === UNSENT ||
        (this.readyState === OPENED && !this._sent) ||
        this.readyState === DONE
      )
    ) {
      this._reset();
      this.setReadyState(DONE);
    }
    // Reset again after, in case modified in handler
    this._reset();
  }

  setResponseHeaders(responseHeaders: Record<string, any> | null): void {
    this.responseHeaders = responseHeaders || null;
    const headers = responseHeaders || {};
    this._lowerCaseResponseHeaders = Object.keys(headers).reduce<
      Record<string, any>
    >((lcaseHeaders, headerName) => {
      lcaseHeaders[headerName.toLowerCase()] = headers[headerName];
      return lcaseHeaders;
    }, {});
  }

  setReadyState(newState: number): void {
    this.readyState = newState;
    this.dispatchEvent(new Event('readystatechange'));
    if (newState === DONE) {
      if (this._aborted) {
        this.dispatchEvent(new Event('abort'));
      } else if (this._hasError) {
        if (this._timedOut) {
          this.dispatchEvent(new Event('timeout'));
        } else {
          this.dispatchEvent(new Event('error'));
        }
      } else {
        this.dispatchEvent(new Event('load'));
      }
      this.dispatchEvent(new Event('loadend'));
    }
  }

  /* global EventListener */
  // @ts-ignore
  addEventListener(type: string, listener: EventListener): void {
    // If we dont' have a 'readystatechange' event handler, we don't
    // have to send repeated LOADING events with incremental updates
    // to responseText, which will avoid a bunch of native -> JS
    // bridge traffic.
    if (type === 'readystatechange' || type === 'progress') {
      this._incrementalEvents = true;
    }
    super.addEventListener(type, listener as any);
  }
}

export default XMLHttpRequest;
