import { createClassWithErrorHandling, hasPort } from '../utils';

describe('createClassWithErrorHandling', () => {
  class TestClass {
    normalMethod(): string {
      return 'normal';
    }

    errorMethod(): void {
      throw new Error('Test error');
    }

    async asyncMethod(): Promise<string> {
      return 'async';
    }

    async asyncErrorMethod(): Promise<void> {
      throw new Error('Async test error');
    }
  }

  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should not interfere with normal methods', () => {
    const EnhancedClass = createClassWithErrorHandling(TestClass);
    const instance = new EnhancedClass();
    expect(instance.normalMethod()).toBe('normal');
  });

  test('should catch and log errors from methods', () => {
    const EnhancedClass = createClassWithErrorHandling(TestClass);
    const instance = new EnhancedClass();
    expect(() => instance.errorMethod()).toThrow('Test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in errorMethod:', expect.any(Error));
  });

  test('should not interfere with async methods that resolve', async () => {
    const EnhancedClass = createClassWithErrorHandling(TestClass);
    const instance = new EnhancedClass();
    await expect(instance.asyncMethod()).resolves.toBe('async');
  });

  test('should catch and log errors from async methods that reject', async () => {
    const EnhancedClass = createClassWithErrorHandling(TestClass);
    const instance = new EnhancedClass();
    await expect(instance.asyncErrorMethod()).rejects.toThrow('Async test error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in asyncErrorMethod:', expect.any(Error));
  });

  test('should handle methods added after instantiation', () => {
    const EnhancedClass = createClassWithErrorHandling(TestClass);
    const instance = new EnhancedClass();
    (instance as any).dynamicMethod = function(): void {
      throw new Error('Dynamic method error');
    };
    expect(() => (instance as any).dynamicMethod()).toThrow('Dynamic method error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in dynamicMethod:', expect.any(Error));
  });
});


describe('hasPort function', () => {
  test('should return true for URLs with explicit ports', () => {
    expect(hasPort('http://example.com:8080')).toBe(true);
    expect(hasPort('ftp://example.com:210')).toBe(true);
  });

  test('should return false for URLs without explicit ports', () => {
    expect(hasPort('http://example.com')).toBe(false);
    expect(hasPort('https://example.com')).toBe(false);
    expect(hasPort('ftp://example.com')).toBe(false);
  });

  test('should return false for invalid URLs', () => {
    expect(hasPort('not a url')).toBe(false);
    expect(hasPort('http:/example.com')).toBe(false);
    expect(hasPort('example.com:8080')).toBe(false);
  });

  test('should return false for empty input', () => {
    expect(hasPort('')).toBe(false);
  });

  test('should return false for non-string input', () => {
    expect(hasPort(null as any)).toBe(false);
    expect(hasPort(undefined as any)).toBe(false);
    expect(hasPort(123 as any)).toBe(false);
    expect(hasPort({} as any)).toBe(false);
  });

  test('should handle URLs with default ports correctly', () => {
    expect(hasPort('http://example.com:80')).toBe(false);
    expect(hasPort('https://example.com:443')).toBe(false);
  });

  test('should handle URLs with IPv6 addresses', () => {
    expect(hasPort('http://[2001:db8::1]:8080')).toBe(true);
    expect(hasPort('https://[2001:db8::1]')).toBe(false);
  });

  test('should handle URLs with userinfo', () => {
    expect(hasPort('http://user:pass@example.com:8080')).toBe(true);
    expect(hasPort('http://user:pass@example.com')).toBe(false);
  });
});