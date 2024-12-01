import { hasPort, sleep } from "./utils";
import { getBaseData, LOG_KEY } from "./common";
import logger from "./logger";

const DEFAULT_PORT = 27751;
class Server {
  private baseUrlArr: Set<string> = new Set();
  private urlsObj: Map<string, string> = new Map();
  private timeout: number;
  private baseData: Record<string, any> = {};
  private urlsListener: (urls: Set<string>) => void = () => {};
  private innerBaseData: Record<string, string> = {};

  constructor(url?: string | Set<string>, timeout: number = 30000) {
    if (typeof url === "string") {
      this.updateUrl(url);
    } else {
      this.setBaseUrlArr(url ?? new Set());
    }
    this.timeout = timeout;
    this.innerBaseData = getBaseData();
    this.handleZeroConf();
  }

  addUrlsListener = (
    onNewUrlCallback: (urls: Set<string>) => void
  ) => {
    this.urlsListener = onNewUrlCallback;
  };

  private requestJoin = async (url: string, token: string) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        token,
        model: this.innerBaseData.Model ?? `${this.innerBaseData.systemName}v${this.innerBaseData.osVersion}`,
      }),
    });
    if (response.status !== 200) {
      return false;
    }
    const json = await response.json();
    if (json.code !== 0) {
      return false;
    }
    return true
  }

  private async handleZeroConf() {
    try {
      const ZeroConf: any = require("react-native-zeroconf")?.default
      if (!ZeroConf) {
        return;
      }
      const zeroConf: import("react-native-zeroconf").default = new ZeroConf();
      zeroConf.on("resolved", async (service) => {
        try {
          const { path, token } = service.txt ?? {};
          const url = `http://${service.host}:${service.port}`;
          if (!(path && token) || this.baseUrlArr.has(url)) {
            return;
          }
          if (!(await this.requestJoin(`${url}${path}`, token))) {
            return;
          }
          this.baseUrlArr.add(url);
          this.urlsObj.set(service.name, url)
          if (this.urlsListener) {
            this.urlsListener(this.baseUrlArr);
          }
        } catch (error) {
          logger.warn(LOG_KEY, "加入日志系统失败---", error);
        }
      });
      zeroConf.on("remove", (name: string) => {
        const currentUrl = this.urlsObj.get(name);
        if (currentUrl === undefined) {
          return;
        }
        this.baseUrlArr.delete(currentUrl)
        this.urlsObj.delete(name)
        if (this.urlsListener) {
          this.urlsListener(this.baseUrlArr);
        }
      });
      zeroConf.on("error", (err: any) => {
        logger.warn(LOG_KEY, "zeroconf出现错误", err);
      })
      zeroConf.scan("http", "tcp");
    } catch (error: any) {
      logger.warn(LOG_KEY, "zeroconf扫描或处理相关逻辑失败或者您根本就没有安装 react-native-zeroconf ，如果您没有安装，那么您将无法使用发现功能", error);
    }
  }

  updateTimeout(timeout = 3000) {
    this.timeout = timeout;
  }

  private send = async (
    path: string,
    data: Record<string, any>
  ): Promise<void> => {
    const request = async (url: string, _data: Record<string, any>) => {
      await Promise.race([
        fetch(`${url}/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=utf-8",
          },
          body: JSON.stringify(
            { ...this.innerBaseData, ...this.baseData, ..._data },
            (_, val) => {
              if (val instanceof Error) {
                return val.toString();
              }
              return val;
            }
          ),
        }),
        sleep(this.timeout, true),
      ]);
    };
    if (this.baseUrlArr.size === 0) {
      return;
    }
    this.baseUrlArr.forEach(async (e) => {
      try {
        await request(e, data)
      } catch (error: any) {
        if (error?.message?.includes("Network request failed") || error?.message?.includes("Timeout")) {
          return
        }
        logger.warn(LOG_KEY, "上报日志失败", error)
      }
    })
  };

  updateUrl(url: string = '') {
    const tempUrl = url.includes("http") ? url : `http://${url}`;
    if (!url) {
      const currentUrl = this.urlsObj.get("Default");
      if (!currentUrl) {
        return;
      }
      this.baseUrlArr.delete(currentUrl);
      this.urlsObj.delete("Default");
    } else if (!hasPort(tempUrl)) {
      this.updateUrl(`${tempUrl}:${DEFAULT_PORT}`);
    } else {
      this.baseUrlArr.add(tempUrl);
      this.urlsObj.set("Default", tempUrl);
    }
  }

  setBaseUrlArr(urlArr: Set<string> = new Set()) {
    this.baseUrlArr = urlArr;
  }

  getBaseUrlArr() {
    return this.baseUrlArr;
  }

  updateBaseData(data: Record<string, any> = {}) {
    this.baseData = data;
  }

  log = async (data: Record<string, any>) => {
    return this.send("log", data);
  };

  network = async (data: Record<string, any>) => {
    return this.send("network", data);
  };
}

export default Server;
