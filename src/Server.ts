import { hasPort, sleep } from "./utils";
import Zeroconf from "react-native-zeroconf";
import { Level, Tag } from "./common";

const DEFAULT_PORT = 27751;
class Server {
  private baseUrlObj: Record<string, string> = {};
  private timeout: number;
  private baseData: Record<string, any> = {};
  private urlsListener: (urls: string[]) => void;

  constructor(url?: string, timeout: number = 30000) {
    if (url) {
      this.updateUrl(url);
    }
    this.timeout = timeout;
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

      zeroconf.on("resolved", (service) => {
        if (service?.txt?.uniqueId) {
          this.baseUrlObj[
            service.txt.uniqueId
          ] = `http://${service.host}:${service.port}`;
          if (this.urlsListener) {
            this.urlsListener(this.getUrls());
          }
        }
      });

      zeroconf.scan("http");
    } catch (error: any) {}
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
          body: JSON.stringify({ ...this.baseData, ..._data }, (_, val) => {
            if (val instanceof Error) {
              return val.toString();
            }
            return val;
          }),
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
