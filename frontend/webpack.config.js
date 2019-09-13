/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

"use strict";

const coreConfig = require('@galtproject/frontend-core/webpack.config');

const UIThread = Object.assign({}, coreConfig({
  path: __dirname,
  disableObfuscator: true,
  // domainLock: ['localhost', '127.0.0.1'],
  copy: [
    {from: "./assets", to: "./assets"},
    {from: "./locale", to: "./locale"},
    {from: "./node_modules/font-awesome/webfonts", to: "./build/webfonts"},
    {from: "./node_modules/ipfs/dist/index.min.js", to: "./build/ipfs.js"},
    //TODO: exclude .js files from mediaelement
    {from: "./node_modules/mediaelement/build", to: "./build"},
    // {from: "./node_modules/@galtproject/space-renderer/public/model-assets/", to: "./model-assets/"},
  ]
}), {
  name: "Geesome UI",
  //https://github.com/vuematerial/vue-material/issues/1182#issuecomment-345764031
  entry: {
    'babel-polyfill': 'babel-polyfill',
    'app.js': './src/main.ts',
    // 'changelog.temp': './CHANGELOG.MD'
  },
  output: {
    filename: './build/[name]'
  }
});

module.exports = [UIThread];
