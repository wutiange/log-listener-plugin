class Server {
  private baseUrl = '';
  private port = 27751
  constructor(url: string) {
    this.updateUrl(url)
  }

  private async send(path: string, data: Record<string, any>) {
    const result = await fetch(`${this.baseUrl}:${this.port}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset:utf-8'
      },
      body: JSON.stringify(data)
    })
    return result.text()
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