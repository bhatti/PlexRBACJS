var path = require('path')
module.exports = {
    entry: ['babel-polyfill', './src/app.js'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    node: {
        fs: 'empty',
        child_process: 'empty'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader'
        }]
    }
}
