const path = require('path'); // ����������� ������ "path" ��� ������ � ������ ������
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },

    module: {
        rules: [
            {
                test: /\.css$/, // ���������� ��������� ��� ��������� ������ � ����������� .css
                use: ['style-loader', 'css-loader'], // ����������, ������������ ��� ��������� CSS-������
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/404.html', to: '404.html' }
            ]
        })
    ],

    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'), // ������� ��� �������
        },
        open: true, // ������������� ��������� �������
    },

    mode: 'development', // ����� ������
};