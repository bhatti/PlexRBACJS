var path = require('path')
module.exports = {
  entry: ['babel-polyfill', './src/app.js'],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  module: {
  loaders: [{
    test: /\.js$/,
    loader: 'babel-loader'
  }]
}}
