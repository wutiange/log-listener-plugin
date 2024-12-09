import queue from './';

describe('ConcurrentQueue', () => {
  beforeEach(() => {
    // 每个测试前重置队列配置
    queue.config({
      concurrency: 10,
      timeout: 3000
    });
  });

  // 测试基本配置
  test('should be configurable', async () => {
    queue.config({
      concurrency: 2,
      timeout: 1000
    });
    // 由于配置是私有属性，我们通过行为来测试配置是否生效
    const startTime = Date.now();
    const results = await Promise.all([
      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 1;
      }),
      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 2;
      }),
      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return 3;
      })
    ]);
    
    const duration = Date.now() - startTime;
    expect(results).toEqual([1, 2, 3]);
    // 由于并发为2，第三个任务需要等待，总时间应该大于1000ms
    expect(duration).toBeGreaterThan(1000);
  });

  // 测试基本任务执行
  test('should execute tasks in order with default settings', async () => {
    const results = await Promise.all([
      queue.add(async () => 1),
      queue.add(async () => 2),
      queue.add(async () => 3)
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  // 测试任务参数传递
  test('should pass arguments to tasks correctly', async () => {
    const task = async (a: number, b: number) => a + b;
    const result = await queue.add(task, 1, 2);
    expect(result).toBe(3);
  });

  // 测试超时处理
  test('should timeout tasks that take too long', async () => {
    queue.config({ timeout: 100 });
    const longTask = async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'done';
    };

    await expect(queue.add(longTask)).rejects.toBe('Timeout');
  });

  // 测试错误处理
  test('should handle task errors properly', async () => {
    const errorTask = async () => {
      throw new Error('Task failed');
    };

    await expect(queue.add(errorTask)).rejects.toThrow('Task failed');
  });

  // 测试并发控制
  test('should respect concurrency limits', async () => {
    queue.config({ concurrency: 2 });
    let runningTasks = 0;
    let maxRunningTasks = 0;

    const task = async () => {
      runningTasks++;
      maxRunningTasks = Math.max(maxRunningTasks, runningTasks);
      await new Promise(resolve => setTimeout(resolve, 100));
      runningTasks--;
      return true;
    };

    // 创建5个任务
    await Promise.all(Array(5).fill(null).map(() => queue.add(task)));

    expect(maxRunningTasks).toBeLessThanOrEqual(2);
  });

  // 测试空队列处理
  test('should handle empty queue gracefully', async () => {
    const result = await queue.add(async () => 'test');
    expect(result).toBe('test');
  });

  // 测试连续添加任务
  test('should handle consecutive task additions', async () => {
    const results: number[] = [];
    
    // 连续添加10个任务
    for (let i = 0; i < 10; i++) {
      queue.add(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        results.push(i);
      });
    }

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(results.length).toBe(10);
    // 检查所有数字是否都在结果中
    for (let i = 0; i < 10; i++) {
      expect(results).toContain(i);
    }
  });
});
