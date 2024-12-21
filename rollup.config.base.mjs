import { fileURLToPath } from 'url';
import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { dirname, resolve } from 'path';

// 正确获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const input = 'index.ts';

export function createConfig(pkg, options = {}) {
  return [
    // 生成 .d.ts 类型文件
    {
      input,
      output: {
        file: pkg.types,
        format: 'es',
      },
      plugins: [dts()],
    },
    // 生成各种格式的构建文件
    {
      input,
      output: [
        {
          file: pkg.main,
          format: 'cjs',
          sourcemap: true,
        },
        {
          file: pkg.module,
          format: 'es',
          sourcemap: true,
        },
      ],
      plugins: [
        typescript({
          tsconfig: resolve(__dirname, './tsconfig.json'),
          declaration: false,
          compilerOptions: {
            outDir: 'dist',
          },
        }),
        nodeResolve({
          extensions: ['.ts', '.js'],
        }),
        commonjs(),
      ],
      ...options,
    },
  ];
}
