export function sleep(ms: number, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(isReject ? () => reject({
      code: 11001,
      key: '@wutiange/log-listener-plugin%%timeout',
      msg: 'Timeout'
    }) : resolve, ms)
  })
}

export function extractDomain(url: string) {
  // 如果 url 是空的或不是字符串，直接返回
  if (!url || typeof url !== 'string') {
    return url;
  }

  // 使用正则表达式匹配 URL
  const match = url.match(/^(https?:\/\/)?([^/:]+)/i);

  // 如果没有匹配到，返回原始输入
  if (!match) {
    return url;
  }

  // 返回匹配到的域名部分
  return match[2];
}


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
