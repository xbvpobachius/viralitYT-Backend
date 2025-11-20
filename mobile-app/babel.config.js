module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated debe ser el ÚLTIMO plugin
      'react-native-reanimated/plugin',
    ],
  };
};

