const path = require("path")
const webpack = require('webpack')
const HtmlWebPackPlugin = require("html-webpack-plugin")
module.exports = {
	entry: {
		main: './src/index.ts'
	},
	output: {
		path: path.join(__dirname, '../dist/public'),
		publicPath: '/',
		filename: '[name].js'
	},
	target: 'web',
	devtool: 'source-map',
	resolve: {
		extensions: ['.ts', '.js', '.html', '.png'],
		alias: {
			'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
		}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: "babel-loader",
			},
			{
				// Loads the javacript into html template provided.
				// Entry point is set below in HtmlWebPackPlugin in Plugins
				test: /\.html$/,
				use: [
					{
						loader: "html-loader",
						//options: { minimize: true }
					}
				]
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader', 'postcss-loader']
			},
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: 'ts-loader'
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: ['file-loader']
			}
		]
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: "./src/index.html",
			filename: "./index.html",
			excludeChunks: [ 'server' ]
		})
	]
}
