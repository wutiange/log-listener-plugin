import '../../console'
import logger from '../../index'
describe("重写日志", () => {
  it("log 没有提前设置 url", () => {
    console.log("log 是否正常打印")
    expect(1).toBe(1)
  })

  it("log 提前设置了 url", () => {
    logger.setBaseUrl("http://192.168.118.103")
    console.log("log 是否正常打印")
    expect(1).toBe(1)
  })

  it('warn', () => {
    logger.setBaseUrl("http://192.168.118.103")
    console.warn("warn 是否正常打印")
    expect(1).toBe(1)
  })

  it('error', () => {
    logger.setBaseUrl("http://192.168.118.103")
    console.error("error 是否正常打印")
    expect(1).toBe(1)
  })
})