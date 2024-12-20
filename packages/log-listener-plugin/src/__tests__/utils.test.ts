import { hasPort } from '../utils';

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
