/**
 * Mock XMLHttpRequest for Jest testing
 */

class XMLHttpRequest {
  static UNSENT = 0;
  static OPENED = 1;
  static HEADERS_RECEIVED = 2;
  static LOADING = 3;
  static DONE = 4;

  constructor() {
    this.readyState = XMLHttpRequest.UNSENT;
    this.status = 0;
    this.responseText = '';
    this.response = null;
    this.responseURL = null;
    this.responseHeaders = null;
    this._headers = {};
    this._sent = false;
    this._method = null;
    this._url = null;
  }

  open(method, url, async = true) {
    this._method = method.toUpperCase();
    this._url = url;
    this.readyState = XMLHttpRequest.OPENED;
  }

  send(data) {
    this._sent = true;
    // Mock implementation will be added later
  }
}

module.exports = XMLHttpRequest;
