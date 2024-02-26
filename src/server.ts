import { sleep } from "./utils";

class Server {
  private baseUrl = '';
  private port = 27751
  private timeout: number;
  private nativeFetch: typeof fetch


  constructor(url: string, timeout: number = 3000) {
    this.updateUrl(url)
    this.timeout = timeout
  }

  updateTimeout(timeout = 3000) {
    this.timeout = timeout
  }

  updateNativeFetch(nativeFetch: typeof fetch) {
    this.nativeFetch = nativeFetch
  }

  private async send(path: string, data: Record<string, any>) {
    try {
      const result = await Promise.race([
        this.nativeFetch?.(`${this.baseUrl}:${this.port}/${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          body: JSON.stringify(data)
        }),
        sleep(this.timeout, true)
      ]) 
      if (result instanceof Response) {
        return result.text()
      }
      return null
    } catch (error) {
      return null
    }
  }

  updateUrl(url: string) {
    this.baseUrl = url
  }

  async log(data: Record<string, any>) {
    return this.send("log", data)
  }

  async network(data: Record<string, any>) {
    return this.send("network", data)
  }
}

export default Server