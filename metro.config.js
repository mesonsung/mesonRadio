const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 配置文件监视器忽略的目录
config.watchFolders = [__dirname];
config.resolver.blacklistRE = /node_modules\/.*\/android\/.cxx\/.*/;

module.exports = config;
