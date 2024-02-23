export function sleep(ms: number, isReject: boolean = false) {
  return new Promise((resolve, reject) => {
    setTimeout(isReject ? reject : resolve, ms)
  })
}