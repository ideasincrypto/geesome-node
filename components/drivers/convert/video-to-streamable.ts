/*
 * Copyright ©️ 2019 GaltProject Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka)
 *
 * Copyright ©️ 2019 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) by
 * [Basic Agreement](ipfs/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS)).
 */

import {DriverInput, OutputSize} from "../interface";
import AbstractDriver from "../abstractDriver";

const stream = require('stream');

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const mediainfo = require('node-mediainfo');

export class VideoToStreambleDriver extends AbstractDriver {
  supportedInputs = [DriverInput.Stream];
  supportedOutputSizes = [OutputSize.Medium];

  async processByStream(inputStream, options: any = {}) {
    const path = `/tmp/` + uuidv4() + '-' + new Date().getTime() + '.' + options.extension;
    
    await new Promise((resolve, reject) =>
      inputStream
        .on('error', error => {
          if (inputStream.truncated)
          // delete the truncated file
            fs.unlinkSync(path);
          reject(error);
        })
        .pipe(fs.createWriteStream(path))
        .on('error', error => reject(error))
        .on('finish', () => resolve({path}))
    );

    let videoInfo = await mediainfo(path);
    let resultStream = fs.createReadStream(path);
    resultStream.on("close", () => {
      fs.unlinkSync(path);
    });
    
    if(videoInfo.media.track[0].IsStreamable === 'Yes') {
      return {
        tempPath: path,
        stream: resultStream,
        type: 'video/' + options.extension,
        processed: false
      };
    }
    
    const transformStream = new stream.Transform();
    transformStream._transform = function (chunk, encoding, done) {
      this.push(chunk);
      done();
    };

    
    new ffmpeg(path)
      .inputFormat(options.extension)
      .outputOptions("-movflags faststart+frag_keyframe+empty_moov")
      .output(transformStream)
      .outputFormat(options.extension)
      .on('error', function (err, stdout, stderr) {
        console.log('An error occurred: ' + err.message, err, stderr);
      })
      .run();

    transformStream.on("finish", () => {
      fs.unlinkSync(path);
    });
    transformStream.on("error", () => {
      fs.unlinkSync(path);
    });
    //
    return {
      tempPath: path,
      stream: transformStream,
      type: 'video/' + options.extension,
      processed: true
    }
  }
}
