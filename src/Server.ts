import { hasPort, sleep } from "./utils";
import Zeroconf from "react-native-zeroconf";
import { getBaseData, getErrMsg, LOG_KEY } from "./common";
import logger from "./logger";
import md5 from 'crypto-js/md5';


const DEFAULT_PORT = 27751;
class Server {
  private baseUrlObj: Record<string, string> = {};
  private timeout: number;
  private baseData: Record<string, any> = {};
  private urlsListener: (
    urls: string[],
    urlsObj: Record<string, string>
  ) => void;
  private innerBaseData: Record<string, string> = {};

  constructor(url?: string | Record<string, string>, timeout: number = 30000) {
    if (typeof url === "string") {
      this.updateUrl(url);
    } else {
      this.setBaseUrlObj(url ?? {});
    }
    this.timeout = timeout;
    this.innerBaseData = getBaseData();
    this.handleZeroConf();
  }

  addUrlsListener = (
    onNewUrlCallback: (urls: string[], urlsObj: Record<string, string>) => void
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
        id: md5(JSON.stringify(this.innerBaseData)).toString(),
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
      const Zeroconf = require("react-native-zeroconf")?.default;
      if (!Zeroconf) {
        return;
      }
      // @ts-ignore
      const zeroconf: Zeroconf = new Zeroconf();
      zeroconf.on("resolved", async (service) => {
        try {
          const { path, token } = service.txt ?? {};
          if (!(path && token) || this.baseUrlObj[token]) {
            return;
          }
          const url = `http://${service.host}:${service.port}`;
          if (!(await this.requestJoin(`${url}${path}`, token))) {
            return;
          }
          this.baseUrlObj[token] = url;
          if (this.urlsListener) {
            this.urlsListener(this.getUrls(), this.baseUrlObj);
          }
        } catch (error) {
          logger.warn(LOG_KEY, "加入日志系统失败---", error);
        }
      });
      zeroconf.on("error", (err) => {
        logger.warn(LOG_KEY, "zeroconf出现错误", err);
      })
      zeroconf.scan("http", "tcp");
    } catch (error: any) {
      logger.warn(LOG_KEY, "zeroconf扫描或处理相关逻辑失败或者您根本就没有安装 react-native-zeroconf ，如果您没有安装，那么您将无法使用发现功能", error);
    }
  }

  updateTimeout(timeout = 3000) {
    this.timeout = timeout;
  }

  getUrls() {
    return Object.values(this.baseUrlObj).map((e) => {
      if (hasPort(e)) {
        return e;
      }
      return `${e}:${DEFAULT_PORT}`;
    });
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
    try {
      if (Object.keys(this.baseUrlObj).length === 0) {
        return;
      }
      await Promise.all(this.getUrls().map(async (e) => request(e, data)));
    } catch (error: any) {
      if (error?.message?.includes("Network request failed")) {
        return
      }
      logger.warn(LOG_KEY, "上报日志失败", error)
    }
  };

  updateUrl(url: string) {
    const tempUrl = url.includes("http") ? url : `http://${url}`;
    if (!url) {
      delete this.baseUrlObj["Default"];
    } else {
      this.baseUrlObj["Default"] = tempUrl;
    }
  }

  setBaseUrlObj(urlObj: Record<string, string>) {
    this.baseUrlObj = urlObj;
  }

  updateBaseData(data: Record<string, any>) {
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
