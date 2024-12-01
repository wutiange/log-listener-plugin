// __mocks__/react-native/Libraries/XHRInterceptor.js

class XHRInterceptor {
  static _isInterceptorEnabled = false
  static openCallback = null
  static requestHeaderCallback = null
  static headerReceivedCallback = null
  static sendCallback = null
  static responseCallback = null
  
  static setOpenCallback = jest.fn((callback) => {
    XHRInterceptor.openCallback = callback;
  })
  static setRequestHeaderCallback = jest.fn((callback) => {
    XHRInterceptor.requestHeaderCallback = callback;
  })
  static setHeaderReceivedCallback = jest.fn((callback) => {
    XHRInterceptor.headerReceivedCallback = callback;
  })
  static setSendCallback = jest.fn((callback) => {
    XHRInterceptor.sendCallback = callback;
  })
  static setResponseCallback = jest.fn((callback) => {
    XHRInterceptor.responseCallback = callback;
  })
  
  static enableInterception = jest.fn(() => {
    XHRInterceptor._isInterceptorEnabled = true;
  })
  
  static disableInterception = jest.fn(() => {
    XHRInterceptor._isInterceptorEnabled = false;
  })
  
  static isInterceptorEnabled = jest.fn(() => XHRInterceptor._isInterceptorEnabled)
};

module.exports = XHRInterceptor;

