module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // NativeWind's babel preset already loads `react-native-worklets/plugin`
    // (which replaces the legacy `react-native-reanimated/plugin` removed
    // in Reanimated 4), so no extra plugin entry is needed here.
  };
};
