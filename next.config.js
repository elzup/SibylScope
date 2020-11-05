const withTM = require('next-transpile-modules')
const withPlugins = require('next-compose-plugins')

module.exports = withPlugins(
  [
    [
      withTM,
      {
        transpileModules: ['react-syntax-highlighter'],
      },
    ],
  ],
  {
    assetPrefix: process.env.PROD_URL || '/',
  }
)
