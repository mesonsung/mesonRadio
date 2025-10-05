module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@utils': './src/utils',
            '@services': './src/services',
            '@models': './src/models',
            '@constants': './src/constants'
          }
        }
      ]
      // 暫時移除 Reanimated 插件 - 如果應用不需要複雜動畫可以不用
      // 'react-native-reanimated/plugin'
    ]
  };
};

