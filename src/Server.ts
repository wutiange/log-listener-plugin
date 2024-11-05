import { hasPort, sleep } from "./utils";
import Zeroconf from "react-native-zeroconf";
import { getBaseData, Level, Tag } from "./common";
import logger from "./logger";

const DEFAULT_PORT = 27751;
class Server {
  private baseUrlObj: Record<string, string> = {};
  private timeout: number;
  private baseData: Record<string, any> = {};
  private urlsListener: (urls: string[]) => void;
  private innerBaseData: Record<string, string> = {};

  constructor(url?: string, timeout: number = 30000) {
    if (url) {
      this.updateUrl(url);
    }
    this.timeout = timeout;
    this.innerBaseData = getBaseData();
    this.handleZeroConf();
  }

  addUrlsListener = (onNewUrlCallback: (urls: string[]) => void) => {
    this.urlsListener = onNewUrlCallback;
  };

  private async handleZeroConf() {
    try {
      const Zeroconf = require("react-native-zeroconf")?.default;
      if (!Zeroconf) {
        return;
      }
      // @ts-ignore
      const zeroconf: Zeroconf = new Zeroconf();
      zeroconf.publishService("http", "tcp", ".local.", "232", 12345)
      zeroconf.on("resolved", async (service) => {
        logger.log("resolved-------", service);
        const { path, token } = service.txt ?? {};
        if (path && token) {
          const url = `http://${service.host}:${service.port}`
          const response = await fetch(`${url}/${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify({ token, model: this.innerBaseData.model, id: `${Date.now().toString(16)}-${Math.random().toString(16)}` }),
          })
          if (response.status !== 200) {
            return;
          }
          const json = await response.json();
          if (json.code !== 0) {
            return;
          }
          this.baseUrlObj[token] = url;
          if (this.urlsListener) {
            this.urlsListener(this.getUrls());
          }
        }
      });
      zeroconf.scan("http", "tcp");
    } catch (error: any) {
      logger.warn("zeroconf error", error);
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
      const errData = {
        message: [
          `${
            error?.message ?? error
          }--->这是@wutiange/log-listener-plugin内部错误，请提issue反馈，issue地址：https://github.com/wutiange/log-listener-plugin/issues`,
        ],
        tag: Tag.LOG_PLUGIN_INTERNAL_ERROR,
        level: Level.ERROR,
        createTime: Date.now(),
      };
      Object.values(this.baseUrlObj).map(async (e) =>
        request(e, errData).catch((_) => {})
      );
    }
  };

  updateUrl(url: string) {
    const tempUrl = url.includes("http") ? url : `http://${url}`;
    this.baseUrlObj["Default"] = tempUrl;
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
