import('./common').then(res => {
  console.log = (...data: any[]) => {
    res._log(...data);
  };

  console.warn = (...data: any[]) => {
    res._warn(...data);
  };

  console.error = (...data: any[]) => {
    res._error(...data);
  };
});
