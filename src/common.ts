export const [log, warn, error] = [console.log, console.warn, console.error]


// @ts-ignore
export const tempFetch = global.fetch as typeof fetch