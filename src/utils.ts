export function sleep(ms: number, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(isReject ? () => reject({
      code: 11001,
      key: '@wutiange/log-listener-plugin%%timeout',
      msg: 'Timeout'
    }) : resolve, ms)
  })
}
