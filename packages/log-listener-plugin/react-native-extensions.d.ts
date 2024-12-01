declare module 'react-native/Libraries/Network/XHRInterceptor' {
  export interface XHRInterceptor {
    isInterceptorEnabled(): boolean;
    setOpenCallback(callback: (method: RequestMethod, url: string, xhr: any) => void): void;
    setRequestHeaderCallback(callback: (header: string, value: string, xhr: any) => void): void;
    setHeaderReceivedCallback(callback: (responseContentType: string, responseSize: number, responseHeaders: Headers, xhr: any) => void): void;
    setSendCallback(callback: (data: string, xhr: any) => void): void;
    setResponseCallback(callback: (status: number, timeout: number, response: Response, responseURL: string, responseType: string, xhr: any) => void): void;
    enableInterception(): void;
    disableInterception(): void;
  }

  const XHRInterceptor: XHRInterceptor;
  export default XHRInterceptor;
}

// global.d.ts
declare const __DEV__: boolean;

declare module 'react-native/Libraries/Blob/FileReader' {
  export default class BlobFileReader {
    readAsText(blob: import("buffer").Blob): void;
    result: string | null;
    error: Error | null;
    addEventListener(event: 'load' | 'error' | 'abort', listener: () => void): void;
    removeEventListener(event: 'load' | 'error' | 'abort', listener: () => void): void;
  }
}

