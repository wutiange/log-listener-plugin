import React from 'react';
import {Button, SafeAreaView, StyleSheet} from 'react-native';
import CustomError from './CustomError';

const App = () => {
  const onPressLog = () => {
    console.log('开始测试简单日志');
    try {
      throw new CustomError('dsadsa');
    } catch (error) {
      console.log(error);
    }
  };

  const onPressWarn = () => {
    console.warn('开始测试警告日志');
  };

  const onPressError = () => {
    console.error('开始测试错误日志');
  };

  const onPressFetchGet = async () => {
    const url = 'https://httpstat.us/200';
    await fetch(url, {
      headers: {
        ['Content-Type']: 'application/json',
      },
    })
      .then(res => res.text())
      .then(res => {
        console.log(res);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="测试 console.log" onPress={onPressLog} />
      <Button title="测试 console.warn" onPress={onPressWarn} />
      <Button title="测试 console.error" onPress={onPressError} />
      <Button title="测试 fetch get" onPress={onPressFetchGet} />
      <Button
        title="测试 自己"
        onPress={() => {
          fetch('http://192.168.3.52:27751/log');
        }}
      />
      <Button
        title="测试 json"
        onPress={() => {
          fetch('http://127.0.0.1:5050/get')
            .then(res => res.json())
            .then(res => console.log(res))
            .catch(err => console.log(err, '----======'));
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
