import React from 'react';
import {Button, SafeAreaView, StyleSheet} from 'react-native';
import CustomError from './CustomError';
import axios from 'axios';

const App = () => {
  const onPressLog = () => {
    console.log(
      '数字', 1,
      '字符串', '字符串',
      '对象', {
        a: 1,
        b: 2,
        c: 3,
      },
      '数组', [1, 2, 3],
      '函数', () => {
        console.log('函数');
      },
      '错误', new Error('错误'),
      'Symbol', Symbol('Symbol'),
      'undefined', undefined,
      'null', null,
      'NaN', NaN,
      'Infinity', Infinity,
      'BigInt', BigInt(1),
      'Date', new Date(),
      'RegExp', /\w+/,
      'Promise', new Promise((resolve, reject) => {
        resolve(1);
      }),
      'Map', new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]),
      'Set', new Set([new Set([0, 6, 12]), 2, 3]),
      'WeakMap', new WeakMap([
        [{}, 1],
        [{}, 2],
        [{}, 3],
      ]),
    );
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

  const onPressAxiosGet = async () => {
    const url = 'https://httpstat.us/200';
    axios.get(url).then(res => {
      console.log(res);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="测试 console.log" onPress={onPressLog} />
      <Button title="测试 console.warn" onPress={onPressWarn} />
      <Button title="测试 console.error" onPress={onPressError} />
      <Button title="测试 fetch get" onPress={onPressFetchGet} />
      <Button title="测试 axios get" onPress={onPressAxiosGet} />
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
