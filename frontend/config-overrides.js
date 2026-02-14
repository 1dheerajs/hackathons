module.exports = function override(config, env) {
  // Tell Webpack to stop enforcing strict file extensions for modern modules
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });

  return config;
};