const {ArgumentParser} = require('argparse');
const path = require('path');
const fse = require('fs-extra');
const {usxStringToJson} = require('../lib/usx-to-usj');

let argParser = new ArgumentParser({
    description: 'Takes in a USX file and converts it into JSON',
});

argParser.add_argument('infile', {
    type: String,
    help: 'input USX(.xml) file',
});

argParser.add_argument('--output_path', {
    type: String,
    help: 'path to write the output file to',
    default: 'STDOUT',
});

let args = argParser.parse_args();
let inFile = path.resolve(args.infile);
let outPath = args.output_path === 'STDOUT' ? 'STDOUT' : path.resolve(args.output_path);

let usxData = fse.readFileSync(inFile, 'utf-8');
let outputJson = usxStringToJson(usxData);
let jsonStr = JSON.stringify(outputJson, null, 2);

if (outPath === 'STDOUT') {
    console.log(jsonStr);
} else {
    fse.writeFileSync(outPath, jsonStr, 'utf-8');
}
