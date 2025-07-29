// global.d.ts
declare const __DEV__: boolean;

declare module 'react-native/Libraries/Blob/FileReader' {
  export default class BlobFileReader {
    readAsText(blob: import('buffer').Blob): void;
    result: string | null;
    error: Error | null;
    addEventListener(
      event: 'load' | 'error' | 'abort',
      listener: () => void,
    ): void;
    removeEventListener(
      event: 'load' | 'error' | 'abort',
      listener: () => void,
    ): void;
  }
}

declare module 'react-native/Libraries/Utilities/createPerformanceLogger' {
  export interface IPerformanceLogger {
    startTimespan(key: string, ...args: any[]): void;
    stopTimespan(key: string, ...args: any[]): void;
  }
}

declare module 'react-native/Libraries/Blob/BlobManager' {
  const BlobManager: {
    isAvailable: boolean;
    addNetworkingHandler(): void;
    createFromOptions(options: any): Blob;
    createFromParts(parts: any[], options?: { type: string }): Blob;
  };
  export default BlobManager;
}

declare module 'react-native/Libraries/Utilities/GlobalPerformanceLogger' {
  import { IPerformanceLogger } from 'react-native/Libraries/Utilities/createPerformanceLogger';
  const GlobalPerformanceLogger: IPerformanceLogger;
  export default GlobalPerformanceLogger;
}

declare module 'react-native/Libraries/Network/RCTNetworking' {
  import { EventSubscription } from 'react-native/Libraries/vendor/emitter/EventEmitter';
  const RCTNetworking: {
    addListener(
      event: string,
      callback: (...args: any[]) => void,
    ): EventSubscription;
    sendRequest(
      method: string,
      trackingName: string,
      url: string,
      headers: Record<string, string>,
      data: any,
      responseType: string,
      incrementalEvents: boolean,
      timeout: number,
      callback: (requestId: number) => void,
      withCredentials: boolean,
    ): void;
    abortRequest(requestId: number): void;
  };
  export default RCTNetworking;
}
