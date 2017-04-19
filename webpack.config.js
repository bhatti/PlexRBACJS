var path = require('path')
module.exports = {
  entry: path.resolve(__dirname, 'app.js'),
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
