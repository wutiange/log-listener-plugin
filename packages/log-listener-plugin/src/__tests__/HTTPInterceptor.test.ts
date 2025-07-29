import { httpInterceptor } from '../HTTPInterceptor';
import XHRInterceptor from '../XHRInterceptor';
import { formDataToString } from '../utils';

// Mock dependencies
jest.mock('buffer', () => ({
  Blob: jest.fn(),
}));
jest.mock('../utils', () => ({
  formDataToString: jest.fn(),
}));

// 在文件顶部添加这个模拟
class MockFormData {
  private data: Record<string, string> = {};

  append(key: string, value: string) {
    this.data[key] = value;
  }

  get(key: string) {
    return this.data[key];
  }

  // 可以根据需要添加更多方法
}

class MockBlob {
  private content: string;
  type: any;
  constructor(parts: any, options: any = {}) {
    this.content = parts ? parts.join('') : '';
    this.type = options.type || '';
  }

  text(): Promise<string> {
    return Promise.resolve(this.content);
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
}
// 全局声明，以避免 TypeScript 错误
declare global {
  // @ts-ignore
  var FormData: typeof MockFormData;
}

// 在测试套件开始前设置全局 FormData
beforeAll(() => {
  // @ts-ignore
  global.FormData = MockFormData;
});

// 在测试套件结束后清理
afterAll(() => {
  // @ts-ignore
  delete global.FormData;
});

describe('HTTPInterceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.warn = jest.fn();
    httpInterceptor.reset();
    (XHRInterceptor.isInterceptorEnabled as jest.Mock).mockReturnValue(false);
  });

  describe('enable', () => {
    it('should enable interception', () => {
      httpInterceptor.enable();
      expect(XHRInterceptor.enableInterception).toHaveBeenCalled();
    });

    it('should not enable if already enabled', () => {
      httpInterceptor.enable();
      httpInterceptor.enable();
      expect(XHRInterceptor.enableInterception).toHaveBeenCalledTimes(1);
    });

    it('should handle ignored hosts', () => {
      httpInterceptor.enable({ ignoredHosts: ['example.com'] });
      expect(XHRInterceptor.enableInterception).toHaveBeenCalled();
    });

    it('should handle ignored patterns', () => {
      httpInterceptor.enable({ ignoredPatterns: [/^GET https:\/\/test\.com/] });
      expect(XHRInterceptor.enableInterception).toHaveBeenCalled();
    });

    it('should handle ignored URLs', () => {
      httpInterceptor.enable({ ignoredUrls: ['https://example.com/api'] });
      expect(XHRInterceptor.enableInterception).toHaveBeenCalled();
    });

    it('should warn if another interceptor is running', () => {
      (XHRInterceptor.isInterceptorEnabled as jest.Mock).mockReturnValue(true);
      console.warn = jest.fn();
      httpInterceptor.enable();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should force enable if specified', () => {
      (XHRInterceptor.isInterceptorEnabled as jest.Mock).mockReturnValue(true);
      httpInterceptor.enable({ forceEnable: true });
      expect(XHRInterceptor.enableInterception).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    it('should disable interception', () => {
      httpInterceptor.enable();
      httpInterceptor.disable();
      expect(XHRInterceptor.disableInterception).toHaveBeenCalled();
    });

    it('should not disable if not enabled', () => {
      httpInterceptor.disable();
      expect(XHRInterceptor.disableInterception).not.toHaveBeenCalled();
    });
  });

  describe('listeners', () => {
    it('should add and remove listeners', () => {
      const listener = jest.fn();
      const removeListener = httpInterceptor.addListener('open', listener);
      expect(httpInterceptor['userListeners'].length).toBe(1);
      removeListener?.();
      expect(httpInterceptor['userListeners'].length).toBe(0);
    });

    it('should not add duplicate listeners', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('open', listener);
      httpInterceptor.addListener('open', listener);
      expect(httpInterceptor['userListeners'].length).toBe(1);
    });

    it('should remove specific listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      httpInterceptor.addListener('open', listener1);
      httpInterceptor.addListener('open', listener2);
      httpInterceptor.removeListener('open', listener1);
      expect(httpInterceptor['userListeners'].length).toBe(1);
      expect(httpInterceptor['userListeners'][0][1]).toBe(listener2);
    });

    it('should remove all listeners', () => {
      httpInterceptor.addListener('open', jest.fn());
      httpInterceptor.addListener('send', jest.fn());
      httpInterceptor.removeAllListener();
      expect(httpInterceptor['userListeners'].length).toBe(0);
    });
  });

  describe('request handling', () => {
    let openCallback: Function;
    let requestHeaderCallback: Function;
    let headerReceivedCallback: Function;
    let sendCallback: Function;
    let responseCallback: Function;

    beforeEach(() => {
      httpInterceptor.enable();
      openCallback = (XHRInterceptor.setOpenCallback as jest.Mock).mock
        .calls[0][0];
      requestHeaderCallback = (
        XHRInterceptor.setRequestHeaderCallback as jest.Mock
      ).mock.calls[0][0];
      headerReceivedCallback = (
        XHRInterceptor.setHeaderReceivedCallback as jest.Mock
      ).mock.calls[0][0];
      sendCallback = (XHRInterceptor.setSendCallback as jest.Mock).mock
        .calls[0][0];
      responseCallback = (XHRInterceptor.setResponseCallback as jest.Mock).mock
        .calls[0][0];
    });

    it('should handle open event', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('open', listener);
      const xhr = {};
      openCallback('GET', 'https://example.com', xhr);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://example.com',
        }),
      );
    });

    it('should handle request header event', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('requestHeader', listener);
      const xhr = {};
      openCallback('GET', 'https://example.com', xhr);
      requestHeaderCallback('Content-Type', 'application/json', xhr);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          requestHeaders: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should handle header received event', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('headerReceived', listener);
      const xhr: { [key in string]: any } = {};
      openCallback('GET', 'https://example.com', xhr);
      xhr.responseHeaders = { 'Content-Type': 'application/json' };
      headerReceivedCallback('application/json', 100, {}, xhr);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          responseContentType: 'application/json',
          responseSize: 100,
          responseHeaders: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should handle send event with JSON data', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('send', listener);
      const xhr = {};
      openCallback('POST', 'https://example.com', xhr);
      sendCallback(JSON.stringify({ key: 'value' }), xhr);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          requestData: { key: 'value' },
        }),
      );
    });

    it('should handle send event with FormData', () => {
      const listener = jest.fn();
      httpInterceptor.addListener('send', listener);
      const xhr = {};
      openCallback('POST', 'https://example.com', xhr);
      const formData = new FormData();
      formData.append('key', 'value');
      (formDataToString as jest.Mock).mockReturnValue('key=value');
      sendCallback(formData, xhr);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          requestData: 'key=value',
        }),
      );
    });

    it('should handle response event', async () => {
      const listener = jest.fn();
      httpInterceptor.addListener('response', listener);
      const xhr = {};
      openCallback('GET', 'https://example.com', xhr);
      await responseCallback(
        200,
        1000,
        { data: 'response' },
        'https://example.com',
        'json',
        xhr,
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          timeout: 1000,
          responseData: { data: 'response' },
          responseURL: 'https://example.com',
          responseType: 'json',
        }),
      );
    });

    it('should handle response event with blob data', async () => {
      const listener = jest.fn();
      httpInterceptor.addListener('response', listener);
      const xhr = {};
      openCallback('GET', 'https://example.com', xhr);
      const mockBlob = new MockBlob(['blob content']);
      await responseCallback(
        200,
        1000,
        mockBlob,
        'https://example.com',
        'blob',
        xhr,
      );
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          responseData: 'blob content',
        }),
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      httpInterceptor.enable();
    });
    it('should handle errors in listeners', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      httpInterceptor.addListener('open', errorListener);
      console.warn = jest.fn();
      const xhr = {};
      const openCallback = (XHRInterceptor.setOpenCallback as jest.Mock).mock
        .calls[0][0];
      openCallback('GET', 'https://example.com', xhr);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Listener error'),
      );
    });
  });

  describe('ignored requests', () => {
    it('should ignore requests to ignored hosts', () => {
      httpInterceptor.enable({ ignoredHosts: ['ignored.com'] });
      const openCallback = (XHRInterceptor.setOpenCallback as jest.Mock).mock
        .calls[0][0];
      const listener = jest.fn();
      httpInterceptor.addListener('open', listener);

      openCallback('GET', 'https://ignored.com', { uniqueId: '123' });
      expect(listener).not.toHaveBeenCalled();

      openCallback('GET', 'https://example.com', { uniqueId: '124' });
      expect(listener).toHaveBeenCalled();
    });

    it('should ignore requests to ignored URLs', () => {
      httpInterceptor.enable({ ignoredUrls: ['https://example.com/ignored'] });
      const openCallback = (XHRInterceptor.setOpenCallback as jest.Mock).mock
        .calls[0][0];
      const listener = jest.fn();
      httpInterceptor.addListener('open', listener);

      openCallback('GET', 'https://example.com/ignored', { uniqueId: '123' });
      expect(listener).not.toHaveBeenCalled();

      openCallback('GET', 'https://example.com/api', { uniqueId: '124' });
      expect(listener).toHaveBeenCalled();
    });

    it('should ignore requests matching ignored patterns', () => {
      httpInterceptor.enable({ ignoredPatterns: [/^GET https:\/\/test\.com/] });
      const openCallback = (XHRInterceptor.setOpenCallback as jest.Mock).mock
        .calls[0][0];
      const listener = jest.fn();
      httpInterceptor.addListener('open', listener);

      openCallback('GET', 'https://test.com/api', { uniqueId: '123' });
      expect(listener).not.toHaveBeenCalled();

      openCallback('POST', 'https://test.com/api', { uniqueId: '124' });
      expect(listener).toHaveBeenCalled();
    });
  });
});
