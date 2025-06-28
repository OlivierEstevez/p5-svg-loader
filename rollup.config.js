import terser from '@rollup/plugin-terser';

export default [
  // UMD build (normal)
  {
    input: 'src/p5-svg-loader.js',
    output: {
      file: 'dist/p5-svg-loader.js',
      format: 'umd',
      name: 'p5SvgLoader',
      globals: {
        p5: 'p5'
      }
    },
    external: ['p5']
  },
  // UMD build (minified)
  {
    input: 'src/p5-svg-loader.js',
    output: {
      file: 'dist/p5-svg-loader.min.js',
      format: 'umd',
      name: 'p5SvgLoader',
      globals: {
        p5: 'p5'
      }
    },
    external: ['p5'],
    plugins: [terser()]
  },
  // ESM build
  {
    input: 'src/p5-svg-loader.js',
    output: {
      file: 'dist/p5-svg-loader.esm.js',
      format: 'esm'
    },
    external: ['p5']
  }
]; 