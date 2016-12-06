const path = require("path");

module.exports = {
  entry: {
    main: path.resolve(__dirname, "./src/main.js")
  },
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
      {test: /\.json$/, loader: "json-loader"}
    ]
  },
  output: {
    path: "dist",
    filename: "[name].bundle.js"
  },
  devtool: "source-map", 
}
