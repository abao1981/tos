const path = require('path');

module.exports = {
    entry: {
        vendor: "./src/index.ts"
    },
    mode: "development",
    
    module: {
        unknownContextCritical : false,
        rules: [{
            test: /\.ts$/,
            loader: 'ts-loader'
        }]
    },
    plugins: [],
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname,"dist"),
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    resolve:{
        extensions: ['.js','jsx','.ts', '.tsx' ]
    }
}