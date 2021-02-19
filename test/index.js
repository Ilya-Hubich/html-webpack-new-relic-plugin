import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

import HtmlWebpackNewRelicPlugin from '../src/index';

const OUTPUT_DIR = path.join(__dirname, '../dist');

describe('HtmlWebpackNewRelicPlugin', () => {
  const testPluginOptions = {
    accountID: '121212',
    agentID: '343434',
    trustKey: '565656',
    license: '123456',
    applicationID: '654321',
    beacon: 'bam-cell.nr-data.net'
  };

  beforeEach(done => {
    rimraf(OUTPUT_DIR, done);
  });

  it('should append new relic script to body', done => {
    const compiler = webpack(
      {
        entry: path.resolve(__dirname, 'fixtures', 'entry.js'),
        output: {
          path: path.resolve(__dirname, '../dist'),
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new HtmlWebpackNewRelicPlugin(testPluginOptions),
        ],
      },
      (err, stats) => {
        const htmlFile = path.resolve(OUTPUT_DIR, 'index.html');
        expect(err).to.be.null;
        expect(fs.existsSync(htmlFile)).to.be.true;


        const file = fs.readFileSync(
          path.resolve(OUTPUT_DIR, htmlFile),
          { encoding: 'utf-8' },
          (err, data) => {
            return data.toString();
          },
        );

        for (const [optionName, optionValue] of Object.entries(testPluginOptions)) {
          // 'license' is the only option that doesn't match what is used in the script
          const scriptOptionName = (optionName === 'license' ? 'licenseKey' : optionName);
          expect(file).include(`${scriptOptionName}:"${optionValue}"`);
        }
        done();
      },
    );
  });

  describe('when its missing configuration variables', () => {
    function testMissingOption(missingOptionName) {
      it(`should throw error if ${missingOptionName} is missing`, done => {
        const compiler = webpack({
          entry: path.resolve(__dirname, 'fixtures', 'entry.js'),
          output: {
            path: path.resolve(__dirname, '../dist'),
          },
          plugins: [new HtmlWebpackPlugin()],
        });
        var optionsMissingOne = Object.assign({}, testPluginOptions)
        delete optionsMissingOne[missingOptionName]
        expect(() => compiler.options.plugins.push(new HtmlWebpackNewRelicPlugin(optionsMissingOne))).to.throw(
          `${missingOptionName} argument is required`,
        );

        done();
      });
    }

    Object.keys(testPluginOptions).forEach((key) => {
      testMissingOption(key);
    });
  });
});
