import React, {Button, SafeAreaView, Text} from 'react-native';

const App = () => {
  console.log('这是app');
  return (
    <SafeAreaView>
      <Text>这是文本</Text>
      <Button
        title="按钮"
        onPress={() => {
          fetch('http://127.0.0.1:5550/test')
            .then(res => {
              return res.json();
            })
            .then(res => {
              console.log('拿到结果了', res);
            })
            .catch(err => {
              console.warn('出现错误了');
            });
        }}
      />
    </SafeAreaView>
  );
};

export default App;
