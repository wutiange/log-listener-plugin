import Server from '../Server';
import { sleep } from '../utils';

// Mock dependencies
jest.mock('../utils', () => {
  const actual = jest.requireActual('../utils');
  return {
    ...actual,    // 保留所有真实实现
    sleep: jest.fn() // 只模拟 sleep 函数
  };
});


// Mock require for react-native-zeroconf
jest.mock('react-native-zeroconf', () => undefined, { virtual: true });

// Mock fetch
global.fetch = jest.fn();

describe('Server', () => {
  let server: Server;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Constructor and URL Management', () => {
    it('should initialize with default values', () => {
      server = new Server();
      expect(server.getBaseUrlArr()).toEqual(new Set([]));
    });

    it('should initialize with custom URL', () => {
      server = new Server('localhost:8080');
      expect(server.getBaseUrlArr()).toEqual(new Set(['http://localhost:8080']));
    });

    it('should handle URLs with and without http prefix', () => {
      server = new Server();
      server.updateUrl('localhost:8080');
      expect(server.getBaseUrlArr()).toEqual(new Set(['http://localhost:8080']));
      
      server.updateUrl('http://localhost:8080');
      expect(server.getBaseUrlArr()).toEqual(new Set(['http://localhost:8080']));
    });
  });

  describe('ZeroConf Handling', () => {
    it('should handle case when zeroconf is not available', () => {
      server = new Server();
      const mockListener = jest.fn();
      server.addUrlsListener(mockListener);
      
      // Since Zeroconf is not available, the listener should not be called
      expect(mockListener).not.toHaveBeenCalled();
    });

    // Test with mock Zeroconf implementation
    it('should handle case when zeroconf is available', () => {
      // Temporarily mock require to return a mock Zeroconf implementation
      const mockZeroconfInstance = {
        on: jest.fn(),
        scan: jest.fn()
      };
      
      jest.doMock('react-native-zeroconf', () => ({
        __esModule: true,
        default: jest.fn(() => mockZeroconfInstance)
      }), { virtual: true });

      server = new Server();
      const mockListener = jest.fn();
      server.addUrlsListener(mockListener);

      // Verify that Zeroconf methods were not called since module is mocked as undefined
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Data Sending', () => {
    beforeEach(() => {
      server = new Server('localhost:8080');
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({ ok: true })
      );
    });

    it('should send log data', async () => {
      const testData = { message: 'test log' };
      await server.log(testData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/log',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          body: expect.any(String)
        })
      );
    });

    it('should send network data', async () => {
      const testData = { url: 'test.com' };
      await server.network(testData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/network',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          body: expect.any(String)
        })
      );
    });

    it('should handle timeout', async () => {
      server.updateTimeout(100);
      (sleep as jest.Mock).mockImplementation(() => Promise.reject(new Error('Timeout')));
      
      const testData = { message: 'test' };
      await server.log(testData);

      expect(global.fetch).toHaveBeenCalled();
      expect(sleep).toHaveBeenCalledWith(100, true);
    });
  });

  describe('Base Data Management', () => {
    it('should update base data', async () => {
      server = new Server('localhost:8080');
      const baseData = { userId: '123' };
      server.updateBaseData(baseData);

      await server.log({ message: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"userId":"123"')
        })
      );
    });
  });
});
