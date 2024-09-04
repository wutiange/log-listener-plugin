import NetworkRequestInfo from "../packages/network-logger/NetworkRequestInfo";

class CompatibilityManager {
  private static requestInfoObj: Record<string, NetworkRequestInfo> = {}
  static async interceptionToNetwork(data: NetworkRequestInfo[]) {
    const tempWillSendArr: NetworkRequestInfo[] = []
    if (Object.keys(CompatibilityManager.requestInfoObj).length === 0) {
      CompatibilityManager.requestInfoObj = data.reduce((e, c) => {
        if (c.endTime) {
          const startReq = c.copy()
          startReq.endTime = 0;
          tempWillSendArr.push(startReq, c)
          return e
        }
        tempWillSendArr.push(c)
        return {...e, [c.id]: c}
      }, {})
    } else {
      data.forEach(e => {
        const tempObj = CompatibilityManager.requestInfoObj
        if (!(e.id in tempObj)) {
          if (!e.endTime) {
            tempWillSendArr.push(e)
            CompatibilityManager.requestInfoObj[e.id] = e
          } else {
            const startReq = e.copy()
            startReq.endTime = 0;
            tempWillSendArr.push(startReq, e)
          }
          return
        }
        if (e.id in tempObj && e.endTime) {
          tempWillSendArr.push(e)
          delete CompatibilityManager.requestInfoObj[e.id]
          return
        }
      })
    }

    // 将要发送的数据转换成兼容的数据
    return CompatibilityManager.asyncSwapSendArr(tempWillSendArr)
  }

  private static async asyncSwapSendArr(data: NetworkRequestInfo[]) {
    const asyncTempArr = await Promise.all(data.map(async (e) => {
      if (e.endTime) {
        return {
          headers: e.responseHeaders,
          body: await e.getResponseBody(),
          requestId: e.id,
          statusCode: e.status,
          endTime: e.endTime,
        };
      } else {
        return {
          url: e.url,
          id: e.id,
          method: e.method,
          headers: e.requestHeaders,
          body: e.getRequestBody(),
          createTime: e.startTime,
        };
      }
    }));
  
    return asyncTempArr;
  }  
}


export default CompatibilityManager