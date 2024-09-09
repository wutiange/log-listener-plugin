import Server from "../Server";
import { hasPort, sleep } from "../utils";

// 模拟 utils 模块
jest.mock('../utils', () => ({
  hasPort: jest.fn(),
  sleep: jest.fn().mockImplementation(() => new Promise(() => {})),
}));

// 模拟 common 模块
jest.mock('../common', () => ({
  tempFetch: jest.fn(),
}));

// 添加模拟的 Response 类
class MockResponse {
  private body: string;

  constructor(body: string) {
    this.body = body;
  }

  text() {
    return Promise.resolve(this.body);
  }

  static [Symbol.hasInstance](instance: any) {
    return instance && typeof instance.text === 'function';
  }
}

// 全局模拟 Response
global.Response = MockResponse as any;

describe('Server', () => {
  let server: Server;
  const mockUrl = 'http://example.com';
  const mockTimeout = 5000;

  beforeEach(() => {
    server = new Server(mockUrl, mockTimeout);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct url and timeout', () => {
      expect(server['baseUrl']).toBe(mockUrl);
      expect(server['timeout']).toBe(mockTimeout);
    });

    it('should use default timeout if not provided', () => {
      const defaultServer = new Server(mockUrl);
      expect(defaultServer['timeout']).toBe(3000);
    });
  });

  describe('updateTimeout', () => {
    it('should update the timeout', () => {
      server.updateTimeout(10000);
      expect(server['timeout']).toBe(10000);
    });

    it('should use default timeout if not provided', () => {
      server.updateTimeout();
      expect(server['timeout']).toBe(3000);
    });
  });

  describe('getPort', () => {
    it('should return empty string if url has port', () => {
      (hasPort as jest.Mock).mockReturnValue(true);
      expect(server['getPort']()).toBe('');
    });

    it('should return default port if url has no port', () => {
      (hasPort as jest.Mock).mockReturnValue(false);
      expect(server['getPort']()).toBe(27751);
    });
  });

  describe('getUrl', () => {
    it('should return correct url with port', () => {
      (hasPort as jest.Mock).mockReturnValue(false);
      expect(server.getUrl()).toBe(`${mockUrl}:27751`);
    });

    it('should return correct url without port', () => {
      (hasPort as jest.Mock).mockReturnValue(true);
      expect(server.getUrl()).toBe(`${mockUrl}:`);
    });
  });

  describe('send', () => {
    const mockPath = 'test';
    const mockData = { key: 'value' };
    const mockResponse = new MockResponse('success');

    it('should return null if baseUrl is empty', async () => {
      server.updateUrl('');
      const result = await server['send'](mockPath, mockData);
      expect(result).toBeNull();
    });

    it('should return response text on successful fetch', async () => {
      const common = require('../common');
      const mockResponseText = 'success';
      const mockResponseObject = new MockResponse(mockResponseText);
      common.tempFetch.mockResolvedValue(mockResponseObject);

      const result = await server['send'](mockPath, mockData);

      expect(result).toBe(mockResponseText);
      expect(common.tempFetch).toHaveBeenCalledWith(
        `${server.getUrl()}/${mockPath}`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          body: JSON.stringify(mockData),
        })
      );
    });

    it('should return null on timeout', async () => {
      const common = require('../common');
      // 模拟 tempFetch 永不解析，以模拟长时间运行的请求
      common.tempFetch.mockImplementation(() => new Promise(() => {}));
      (sleep as jest.Mock).mockResolvedValue(true);
      const result = await server['send'](mockPath, mockData);
      expect(result).toBeNull();
    });

    it('should handle Error objects in JSON stringification', async () => {
      const common = require('../common');
      common.tempFetch.mockResolvedValue(mockResponse);
      const dataWithError = { error: new Error('Test error') };
      await server['send'](mockPath, dataWithError);
      expect(common.tempFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Error: Test error'),
        })
      );
    });

    it('should return null on fetch error', async () => {
      const common = require('../common');
      common.tempFetch.mockRejectedValue(new Error('Fetch error'));
      const result = await server['send'](mockPath, mockData);
      expect(result).toBeNull();
    });
  });

  describe('updateUrl', () => {
    it('should update the baseUrl', () => {
      const newUrl = 'http://newexample.com';
      server.updateUrl(newUrl);
      expect(server['baseUrl']).toBe(newUrl);
    });
  });

  describe('log', () => {
    it('should call send with correct path and data', async () => {
      const sendSpy = jest.spyOn(server as any, 'send').mockResolvedValue('log result');
      const logData = { message: 'Test log' };
      const result = await server.log(logData);
      expect(sendSpy).toHaveBeenCalledWith('log', logData);
      expect(result).toBe('log result');
    });
  });

  describe('network', () => {
    it('should call send with correct path and data', async () => {
      const sendSpy = jest.spyOn(server as any, 'send').mockResolvedValue('network result');
      const networkData = { url: 'http://test.com', status: 200 };
      const result = await server.network(networkData);
      expect(sendSpy).toHaveBeenCalledWith('network', networkData);
      expect(result).toBe('network result');
    });
  });
});
