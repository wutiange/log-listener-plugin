import URL from 'url-parse';
import logger from './logger';

export function sleep(ms: number, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(
      isReject
        ? () =>
            reject({
              code: 11001,
              key: '@wutiange/log-listener-plugin%%timeout',
              message: 'Timeout',
            })
        : resolve,
      ms,
    );
  });
}

// 检查 url 是否有端口号，不包含内置的端口号，比如 80 ，443 等
export function hasPort(url: string) {
  // 如果 url 是空的或不是字符串，返回 false
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // 使用 URL 构造函数解析 URL
    const parsedUrl = new URL(url);

    // 检查 port 属性是否为空
    // 注意：如果使用默认端口（如 HTTP 的 80 或 HTTPS 的 443），port 会是空字符串
    return parsedUrl.port !== '';
  } catch (error) {
    logger.error(error);
    // 如果 URL 无效，捕获错误并返回 false
    return false;
  }
}

export function formDataToString(formData: FormData): string {
  const boundary =
    '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
  let result = '';
  // 这是 react-native 中的实现，这里面是存在这个方法的
  const parts = (formData as any).getParts();
  for (const part of parts) {
    result += `--${boundary}\r\n`;
    result += `Content-Disposition: ${part.headers['content-disposition']}\r\n`;
    if (part.headers['content-type']) {
      result += `Content-Type: ${part.headers['content-type']}\r\n`;
    }
    const value = 'string' in part ? part.string : part.uri;
    result += `Content-Length: ${value.length}\r\n\r\n`;
    result += `${value}\r\n`;
  }
  result += `--${boundary}--\r\n`;
  return result;
}

export function typeReplacer(key: string, val: any) {
  if (val instanceof Error) {
    return val.toString();
  } else if (val instanceof Function) {
    return Function.prototype.toString.call(val);
  } else if (val instanceof Symbol) {
    return val.toString();
  } else if (typeof val === 'bigint') {
    return val.toString();
  } else if (val instanceof RegExp) {
    return val.toString();
  } else if (val instanceof Set) {
    return Array.from(val);
  } else if (val instanceof Map) {
    return Object.fromEntries(val);
  }
  return val;
}
