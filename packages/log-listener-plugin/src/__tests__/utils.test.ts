import { hasPort, formDataToString, sleep, typeReplacer } from '../utils';

describe('hasPort function', () => {
  it('should return true for URLs with explicit ports', () => {
    expect(hasPort('http://example.com:8080')).toBe(true);
    expect(hasPort('ftp://example.com:210')).toBe(true);
  });

  it('should return false for URLs without explicit ports', () => {
    expect(hasPort('http://example.com')).toBe(false);
    expect(hasPort('https://example.com')).toBe(false);
    expect(hasPort('ftp://example.com')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(hasPort('not a url')).toBe(false);
    expect(hasPort('http:/example.com')).toBe(false);
    expect(hasPort('example.com:8080')).toBe(false);
  });

  it('should return false for empty input', () => {
    expect(hasPort('')).toBe(false);
  });

  it('should return false for non-string input', () => {
    expect(hasPort(null as any)).toBe(false);
    expect(hasPort(undefined as any)).toBe(false);
    expect(hasPort(123 as any)).toBe(false);
    expect(hasPort({} as any)).toBe(false);
  });

  it('should handle URLs with default ports correctly', () => {
    expect(hasPort('http://example.com:80')).toBe(false);
    expect(hasPort('https://example.com:443')).toBe(false);
  });

  it('should handle URLs with IPv6 addresses', () => {
    expect(hasPort('http://[2001:db8::1]:8080')).toBe(true);
    expect(hasPort('https://[2001:db8::1]')).toBe(false);
  });

  it('should handle URLs with userinfo', () => {
    expect(hasPort('http://user:pass@example.com:8080')).toBe(true);
    expect(hasPort('http://user:pass@example.com')).toBe(false);
  });
});

describe('formDataToString', () => {
  let mockFormData: FormData;

  beforeEach(() => {
    // 创建一个模拟的 FormData 对象
    mockFormData = new FormData();
    // 模拟 getParts 方法
    (mockFormData as any).getParts = jest.fn();
  });

  it('should convert form data with text fields to string', () => {
    // 模拟 getParts 返回包含文本字段的数据
    (mockFormData as any).getParts.mockReturnValue([
      {
        headers: {
          'content-disposition': 'form-data; name="field1"',
        },
        string: 'value1',
      },
    ]);

    const result = formDataToString(mockFormData);

    // 验证基本结构
    expect(result).toMatch(/^------WebKitFormBoundary.*\r\n/);
    expect(result).toMatch(/Content-Disposition: form-data; name="field1"\r\n/);
    expect(result).toMatch(/Content-Length: 6\r\n/);
    expect(result).toMatch(/value1\r\n/);
    expect(result).toMatch(/----WebKitFormBoundary.*--\r\n$/);
  });

  it('should handle form data with content-type header', () => {
    // 模拟 getParts 返回包含 content-type 的数据
    (mockFormData as any).getParts.mockReturnValue([
      {
        headers: {
          'content-disposition': 'form-data; name="file"; filename="test.txt"',
          'content-type': 'text/plain',
        },
        string: 'file content',
      },
    ]);

    const result = formDataToString(mockFormData);

    expect(result).toMatch(
      /Content-Disposition: form-data; name="file"; filename="test.txt"\r\n/,
    );
    expect(result).toMatch(/Content-Type: text\/plain\r\n/);
    expect(result).toMatch(/Content-Length: 12\r\n/);
    expect(result).toMatch(/file content\r\n/);
  });

  it('should handle multiple form fields', () => {
    // 模拟 getParts 返回多个字段
    (mockFormData as any).getParts.mockReturnValue([
      {
        headers: {
          'content-disposition': 'form-data; name="field1"',
        },
        string: 'value1',
      },
      {
        headers: {
          'content-disposition': 'form-data; name="field2"',
        },
        string: 'value2',
      },
    ]);

    const result = formDataToString(mockFormData);

    expect(result).toMatch(/field1.*value1.*field2.*value2/s);
    expect((result.match(/----WebKitFormBoundary/g) || []).length).toBe(3); // 开始、中间、结束
  });

  it('should handle URI parts', () => {
    // 模拟 getParts 返回包含 URI 的数据
    (mockFormData as any).getParts.mockReturnValue([
      {
        headers: {
          'content-disposition': 'form-data; name="file"',
          'content-type': 'image/jpeg',
        },
        uri: 'file:///path/to/image.jpg',
      },
    ]);

    const result = formDataToString(mockFormData);

    expect(result).toMatch(/Content-Type: image\/jpeg\r\n/);
    expect(result).toMatch(/file:\/\/\/path\/to\/image.jpg\r\n/);
  });
});

describe('sleep function', () => {
  // 测试正常延迟情况
  it('should resolve after specified delay', async () => {
    const startTime = Date.now();
    const delay = 100;

    await sleep(delay);
    const endTime = Date.now();
    const actualDelay = endTime - startTime;

    // 由于 JavaScript 定时器的不精确性，我们允许一个小的误差范围
    expect(actualDelay).toBeGreaterThanOrEqual(delay);
    expect(actualDelay).toBeLessThan(delay + 50); // 允许 50ms 的误差
  });

  // 测试超时拒绝情况
  it('should reject with timeout error when isReject is true', async () => {
    const delay = 100;

    await expect(sleep(delay, true)).rejects.toEqual({
      code: 11001,
      key: '@wutiange/log-listener-plugin%%timeout',
      message: 'Timeout',
    });
  });
});

describe('typeReplacer', () => {
  // 测试 Error 类型转换
  it('should convert Error to string', () => {
    const error = new Error('test error');
    expect(typeReplacer('error', error)).toBe('Error: test error');
  });

  // 测试 Function 类型转换
  it('should convert Function to string', () => {
    const fn = function test() {
      return 'hello';
    };
    const result = typeReplacer('fn', fn);
    expect(result).toContain('function test()');
  });

  // 测试 Symbol 类型转换
  it('should convert Symbol to string', () => {
    const sym = Symbol('test');
    expect(typeReplacer('symbol', sym)).toBe('Symbol(test)');
  });

  // 测试 BigInt 类型转换
  it('should convert BigInt to string', () => {
    const big = BigInt(9007199254740991);
    expect(typeReplacer('bigint', big)).toBe('9007199254740991');
  });

  // 测试 RegExp 类型转换
  it('should convert RegExp to string', () => {
    const regex = /test/g;
    expect(typeReplacer('regex', regex)).toBe('/test/g');
  });

  // 测试 Set 类型转换
  it('should convert Set to array', () => {
    const set = new Set([1, 2, 3]);
    expect(typeReplacer('set', set)).toEqual([1, 2, 3]);
  });

  // 测试 Map 类型转换
  it('should convert Map to object', () => {
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
    expect(typeReplacer('map', map)).toEqual({
      key1: 'value1',
      key2: 'value2',
    });
  });

  // 测试普通值不变
  it('should return primitive values as is', () => {
    expect(typeReplacer('string', 'test')).toBe('test');
    expect(typeReplacer('number', 42)).toBe(42);
    expect(typeReplacer('boolean', true)).toBe(true);
    expect(typeReplacer('null', null)).toBe(null);
    expect(typeReplacer('undefined', undefined)).toBe(undefined);
  });

  // 测试普通对象不变
  it('should return objects as is', () => {
    const obj = { name: 'test', age: 25 };
    expect(typeReplacer('object', obj)).toEqual(obj);
  });
});
