import React from 'react';
import {Button, SafeAreaView, StyleSheet} from 'react-native';

const App = () => {
  const onPressLog = () => {
    console.log('开始测试简单日志');
    console.log(new Error('打印日志'));
  };

  const onPressWarn = () => {
    console.warn('开始测试警告日志');
  };

  const onPressError = () => {
    console.error('开始测试错误日志');
  };

  const onPressFetchGet = async () => {
    try {
      const url = 'https://jsonplaceholder.typicode.com/posts';
      const result = await fetch(url);
      console.log(await result.json());
      const request = new Request(url, {method: 'get'});
      await fetch(request);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="测试 console.log" onPress={onPressLog} />
      <Button title="测试 console.warn" onPress={onPressWarn} />
      <Button title="测试 console.error" onPress={onPressError} />
      <Button title="测试 fetch get" onPress={onPressFetchGet} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
