class FileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.readyState = FileReader.EMPTY;
  }

  static EMPTY = 0;
  static LOADING = 1;
  static DONE = 2;

  addEventListener(event, callback) {
    this[`on${event}`] = callback;
  }

  removeEventListener(event, callback) {
    if (this[`on${event}`] === callback) {
      this[`on${event}`] = null;
    }
  }

  readAsText(blob) {
    this._read(blob, 'text');
  }

  readAsArrayBuffer(blob) {
    this._read(blob, 'arraybuffer');
  }

  _read(blob, resultType) {
    this.readyState = FileReader.LOADING;
    setTimeout(() => {
      this.readyState = FileReader.DONE;
      if (resultType === 'text') {
        this.result = blob.text();
      } else if (resultType === 'arraybuffer') {
        // 这里我们简单地返回一个空的 ArrayBuffer
        this.result = new ArrayBuffer(0);
      }
      if (this.onload) this.onload({target: this});
    }, 0);
  }
}

module.exports = FileReader;