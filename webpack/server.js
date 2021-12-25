const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

module.exports = {
	entry: {
		server: './src/server/index.ts',
	},
	devtool: 'eval-source-map',
	output: {
		path: path.join(__dirname, '../dist'),
		publicPath: '/',
		filename: '[name].js'
	},
	target: 'node',
	node: {
		// Need this when working with express, otherwise the build fails
		__dirname: false,   // if you don't put this is, __dirname
		__filename: false,  // and __filename return blank or /
	},
	externals: [nodeExternals()], // Need this to avoid error when working with Express
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: {
					loader: 'ts-loader'
				}
			},
			{
				// Transpiles ES6-8 into ES5
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader"
				}
			},
		]
	}
}
