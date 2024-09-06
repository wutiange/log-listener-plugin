// __mocks__/react-native/XHRInterceptor.js

const XHRInterceptor = {
  isInterceptorEnabled: false,
  requestInterceptors: [],
  responseInterceptors: [],
  responseErrorInterceptors: [],
  
  setResponseCallback: jest.fn(),
  setRequestCallback: jest.fn(),
  setSendCallback: jest.fn(),
  setHeaderReceivedCallback: jest.fn(),
  setResponseErrorCallback: jest.fn(),
  
  enableInterception: jest.fn(() => {
    XHRInterceptor.isInterceptorEnabled = true;
  }),
  
  disableInterception: jest.fn(() => {
    XHRInterceptor.isInterceptorEnabled = false;
  }),
  
  isInterceptorEnabled: jest.fn(() => XHRInterceptor.isInterceptorEnabled),
  
  // 添加其他可能需要的方法
};

module.exports = XHRInterceptor;

