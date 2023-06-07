const { ArgumentParser } = require('argparse');
const path = require('path');
const fse = require('fs-extra');
const { DOMParser } = require('xmldom');

const VERSION_NUM = '0.0.1-alpha.2';
const SPEC_NAME = 'USJ';

function usxDomToJson1(inputUsxElement) {
  let key = inputUsxElement.tagName;
  let text = null;
  let outObj = {};
  let action = 'append';
  let attribs = {};
  if (inputUsxElement.attributes) {
    for (let i = 0; i < inputUsxElement.attributes.length; i++) {
      let attrib = inputUsxElement.attributes[i];
      attribs[attrib.name] = attrib.value;
    }
  }

  if (attribs['style']) {
    key = `${key}:${attribs['style']}`;
    delete attribs['style'];
  }

  outObj['type'] = key;
  outObj = { ...outObj, ...attribs };

  if (inputUsxElement.firstChild && inputUsxElement.firstChild.nodeType === 3 && inputUsxElement.firstChild.nodeValue.trim() !== '') {
    text = inputUsxElement.firstChild.nodeValue.trim();
  }

  let children = Array.from(inputUsxElement.childNodes);
  outObj['content'] = [];

  if (text) {
    outObj['content'].push(text);
  }

  for (let child of children) {
    if (child.tagName === undefined) {
      continue;
    }
    let [childDict, whatToDo] = usxDomToJson1(child);

    switch (whatToDo) {
      case 'append':
        outObj['content'].push(childDict);
        break;
      case 'merge':
        outObj['content'] = outObj['content'].concat(childDict);
        break;
      case 'ignore':
        break;
      default:
        break;
    }

    if (child.nextSibling && child.nextSibling.nodeType === 3 && child.nextSibling.nodeValue.trim() !== '') {
      outObj['content'].push(child.nextSibling.nodeValue.trim());
    }
  }

  if (outObj['content'].length === 0) {
    delete outObj['content'];
  }

  if ('eid' in outObj && ['verse', 'chapter'].includes(inputUsxElement.tagName)) {
    action = 'ignore';
  }

  if (['chapter:c', 'verse:v'].includes(key)) {
    if ('altnumber' in outObj) {
      outObj = [outObj];
      outObj.push({
        'type': `char:${key.slice(-1)}a`,
        'content': [outObj[0]['altnumber']],
      });
      delete outObj[0]['altnumber'];
      action = 'merge';
    }

    if ('pubnumber' in outObj) {
      if (!Array.isArray(outObj)) {
        outObj = [outObj];
      }
      outObj.push({
        'type': `para:${key.slice(-1)}p`,
        'content': [outObj[0]['pubnumber']],
      });
      delete outObj[0]['pubnumber'];
      action = 'merge';
    }
  }

  return [outObj, action];
}

function usxDomToJson(input_usx_dom) {
  let [outputJson, _] = usxDomToJson1(input_usx_dom);
  outputJson['type'] = SPEC_NAME;
  outputJson['version'] = VERSION_NUM;
  return outputJson;
}

function main() {
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

  try {
    let usxData = fse.readFileSync(inFile, 'utf-8');
    let parser = new DOMParser();
    let inputUsx = parser.parseFromString(usxData, 'text/xml');
    let outputJson = usxDomToJson(inputUsx.documentElement);
    let jsonStr = JSON.stringify(outputJson, null, 2);

    if (outPath === 'STDOUT') {
      console.log(jsonStr);
    } else {
      fse.writeFileSync(outPath, jsonStr, 'utf-8');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

if (require.main === module) {
  main();
}

