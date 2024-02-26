import React, {Button, SafeAreaView, Text} from 'react-native';

const App = () => {
  const testNetwork = () => {
    fetch('http://127.0.0.1:5550/test')
      .then(res => {
        return res.json();
      })
      .then(res => {
        console.log('拿到结果了', res);
      })
      .catch((err: any) => {
        console.warn('出现错误了', err.message);
      });
  };

  const logTest = () => {
    console.log('这是会显示日志');
  };

  return (
    <SafeAreaView>
      <Text>这是文本</Text>
      <Button title="测试网络日志" onPress={testNetwork} />
      <Button title="测试普通日志" onPress={logTest} />
    </SafeAreaView>
  );
};

export default App;
