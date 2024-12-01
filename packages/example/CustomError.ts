class CustomError extends Error {
  constructor(message: string) {
    super(message);

    // 获取错误发生的位置
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    const stackLines = this.stack?.split('\n');
    console.log(stackLines);
    if (stackLines && stackLines.length > 1) {
      // 通常第二行包含文件名、行号和列号
      const match = stackLines[1].match(/at\s+(.+):(\d+):(\d+)/);
      if (match) {
        const [, file, line, column] = match;
        console.log(`错误发生在文件 ${file} 的第 ${line} 行，第 ${column} 列`);
      }
    }
  }
}

export default CustomError;
