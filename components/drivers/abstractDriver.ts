/*
 * Copyright ©️ 2018-2020 Galt•Project Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2018-2020 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

import {DriverInput, IDriver, IDriverResponse, OutputSize} from "./interface";

const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

export default class AbstractDriver implements IDriver {
  supportedInputs = [];
  supportedOutputSizes = [];
  
  isInputSupported(input: DriverInput) {
    return _.includes(this.supportedInputs, input);
  }
  
  isOutputSizeSupported(outputSize: OutputSize) {
    return _.includes(this.supportedOutputSizes, outputSize);
  }

  async isInputExtensionSupported(inputExtension: string) {
    return false;
  }
  
  processByStream?(inputSteam, options?): Promise<any> { return null; };

  processByContent?(inputContent, options?): Promise<any> { return null; };

  processBySource?(sourceLink, options?): Promise<any> { return null; };

  processByPath?(path, options?): Promise<any> { return null; };

  async processByPathWrapByPath(path, options: any = {}) {
    console.log('processByPath path', path);
    const result: any = await this.processByStream(fs.createReadStream(path), options);
    const resultPath = `/tmp/` + uuidv4() + '-' + new Date().getTime();

    console.log('processByPath resultPath', resultPath);
    await new Promise((resolve, reject) =>
        result.stream
            .on('error', error => {
              if (result.stream.truncated)
                  // delete the truncated file
                fs.unlinkSync(resultPath);
              reject(error);
            })
            .pipe(fs.createWriteStream(resultPath))
            .on('close', () => resolve({path: resultPath}))
    );
    console.log('processByPath result', result);
    result.path = resultPath;
    return result;
  }
}
