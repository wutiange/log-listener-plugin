const EMPTY = 0;
const LOADING = 1;
const DONE = 2;

class FileReader {
  EMPTY = EMPTY;
  LOADING = LOADING;
  DONE = DONE;

  error = null;
  readyState = EMPTY;
  result = null;
  
  onloadstart = null;
  onprogress = null;
  onload = null;
  onabort = null;
  onerror = null;
  onloadend = null;

  abort() {
    this.readyState = DONE;
    this.result = null;
    if (this.onabort) this.onabort();
    if (this.onloadend) this.onloadend();
  }

  readAsArrayBuffer(blob) {
    this._read(blob, 'arrayBuffer');
  }

  readAsBinaryString(blob) {
    this._read(blob, 'binaryString');
  }

  readAsDataURL(blob) {
    this._read(blob, 'dataURL');
  }

  readAsText(blob, encoding) {
    this._read(blob, 'text', encoding);
  }

  _read(blob, format, encoding) {
    this.readyState = LOADING;
    if (this.onloadstart) this.onloadstart();

    // 模拟异步读取过程
    setTimeout(() => {
      this.readyState = DONE;
      // 根据不同的格式返回模拟数据
      switch (format) {
        case 'arrayBuffer':
          this.result = new ArrayBuffer(8);
          break;
        case 'binaryString':
          this.result = 'binaryStringContent';
          break;
        case 'dataURL':
          this.result = 'data:text/plain;base64,dGVzdA==';
          break;
        case 'text':
          this.result = 'Hello, this is a mock text content.';
          break;
      }

      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    }, 100); // 模拟 100ms 的读取时间
  }
}

module.exports = FileReader;
