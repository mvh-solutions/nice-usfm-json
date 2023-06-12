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

function usxDomToJson(inputUsxDom) {
  let [outputJson, _] = usxDomToJson1(inputUsxDom);
  outputJson['type'] = SPEC_NAME;
  outputJson['version'] = VERSION_NUM;
  return outputJson;
}

function usxStringToJson(usxString) {
    let parser = new DOMParser();
    let inputUsxDom = parser.parseFromString(usxString, 'text/xml');
    return usxDomToJson(inputUsxDom.documentElement);
}

module.exports = { usxDomToJson, usxStringToJson }
