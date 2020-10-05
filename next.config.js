const withTM = require('next-transpile-modules')
const withPlugins = require('next-compose-plugins')
module.exports = withPlugins([
  [
    withTM,
    {
      transpileModules: ['react-syntax-highlighter'],
    },
  ],
])
