export function sleep(ms: number, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(isReject ? () => reject({
      code: 11001,
      key: '@wutiange/log-listener-plugin%%timeout',
      msg: 'Timeout'
    }) : resolve, ms)
  })
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
    // 如果 URL 无效，捕获错误并返回 false
    return false;
  }
}


type Constructor<T = {}> = new (...args: any[]) => T;

export function createClassWithErrorHandling<T extends Constructor>(BaseClass: T): T {
  return new Proxy(BaseClass, {
    construct(target: T, args: any[]): object {
      const instance = new target(...args);
      return new Proxy(instance, {
        get(target: any, prop: string | symbol): any {
          const value = target[prop];
          if (typeof value === 'function') {
            return function(this: any, ...args: any[]): any {
              try {
                const result = value.apply(this, args);
                if (result instanceof Promise) {
                  return result.catch((error: Error) => {
                    console.error(`Error in ${String(prop)}:`, error);
                    throw error; // 重新抛出错误，以便调用者可以捕获它
                  });
                }
                return result;
              } catch (error) {
                console.error(`Error in ${String(prop)}:`, error);
                throw error; // 重新抛出错误，以便调用者可以捕获它
              }
            };
          }
          return value;
        },
        set(target: any, prop: string | symbol, value: any): boolean {
          if (typeof value === 'function') {
            target[prop] = function(this: any, ...args: any[]): any {
              try {
                const result = value.apply(this, args);
                if (result instanceof Promise) {
                  return result.catch((error: Error) => {
                    console.error(`Error in ${String(prop)}:`, error);
                    throw error;
                  });
                }
                return result;
              } catch (error) {
                console.error(`Error in ${String(prop)}:`, error);
                throw error;
              }
            };
          } else {
            target[prop] = value;
          }
          return true;
        }
      });
    }
  });
}
