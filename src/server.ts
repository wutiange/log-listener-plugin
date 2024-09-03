import {hasPort, sleep} from './utils';
const DEFAULT_PORT = 27751
class Server {
  private baseUrl = '';
  private timeout: number;

  constructor(url: string, timeout: number = 3000) {
    this.updateUrl(url);
    this.timeout = timeout;
  }

  updateTimeout(timeout = 3000) {
    this.timeout = timeout;
  }

  private getPort() {
    if (hasPort(this.baseUrl)) {
      return ''
    }
    return DEFAULT_PORT;
  }

  private async send(path: string, data: Record<string, any>) {
    try {
      if (!this.baseUrl) {
        return null;
      }
      const common = await import('./common');
      const result = await Promise.race([
        common.tempFetch(`${this.baseUrl}:${this.getPort()}/${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8',
          },
          body: JSON.stringify(data, (_, val) => {
            if (val instanceof Error) {
              return val.toString();
            }
            return val;
          }),
        }),
        sleep(this.timeout, true),
      ]);
      if (result instanceof Response) {
        return result.text();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  updateUrl(url: string) {
    this.baseUrl = url;
  }

  async log(data: Record<string, any>) {
    return this.send('log', data);
  }

  async network(data: Record<string, any>) {
    return this.send('network', data);
  }
}

export default Server;
