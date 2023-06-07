const { ArgumentParser } = require('argparse');
const fs = require('fs');
const { DOMParser } = require('xmldom');
const XMLSerializer = require('xmldom').XMLSerializer;

const VERSION_NUM = '0.0.1-alpha.2';
const SPEC_NAME = 'USJ';

function convert_usx(input_usx_elmt) {
  let key = input_usx_elmt.tagName;
  let text = null;
  let out_obj = {};
  let action = 'append';
  let attribs = {};
  if (input_usx_elmt.attributes) {
    for (let i = 0; i < input_usx_elmt.attributes.length; i++) {
      let attrib = input_usx_elmt.attributes[i];
      attribs[attrib.name] = attrib.value;
    }
  }

  if (attribs['style']) {
    key = `${key}:${attribs['style']}`;
    delete attribs['style'];
  }

  out_obj['type'] = key;
  out_obj = { ...out_obj, ...attribs };

  if (input_usx_elmt.firstChild && input_usx_elmt.firstChild.nodeType === 3 && input_usx_elmt.firstChild.nodeValue.trim() !== '') {
    text = input_usx_elmt.firstChild.nodeValue.trim();
  }

  let children = Array.from(input_usx_elmt.childNodes);
  out_obj['content'] = [];

  if (text) {
    out_obj['content'].push(text);
  }

  for (let child of children) {
    if (child.tagName == undefined) {
      continue;
    }
    let [child_dict, what_to_do] = convert_usx(child);

    switch (what_to_do) {
      case 'append':
        out_obj['content'].push(child_dict);
        break;
      case 'merge':
        out_obj['content'] = out_obj['content'].concat(child_dict);
        break;
      case 'ignore':
        break;
      default:
        break;
    }

    if (child.nextSibling && child.nextSibling.nodeType === 3 && child.nextSibling.nodeValue.trim() !== '') {
      out_obj['content'].push(child.nextSibling.nodeValue.trim());
    }
  }

  if (out_obj['content'].length === 0) {
    delete out_obj['content'];
  }

  if ('eid' in out_obj && ['verse', 'chapter'].includes(input_usx_elmt.tagName)) {
    action = 'ignore';
  }

  if (['chapter:c', 'verse:v'].includes(key)) {
    if ('altnumber' in out_obj) {
      out_obj = [out_obj];
      out_obj.push({
        'type': `char:${key.slice(-1)}a`,
        'content': [out_obj[0]['altnumber']],
      });
      delete out_obj[0]['altnumber'];
      action = 'merge';
    }

    if ('pubnumber' in out_obj) {
      if (!Array.isArray(out_obj)) {
        out_obj = [out_obj];
      }
      out_obj.push({
        'type': `para:${key.slice(-1)}p`,
        'content': [out_obj[0]['pubnumber']],
      });
      delete out_obj[0]['pubnumber'];
      action = 'merge';
    }
  }

  return [out_obj, action];
}

function usx_to_json(input_usx) {
  let [output_json, _] = convert_usx(input_usx);
  output_json['type'] = SPEC_NAME;
  output_json['version'] = VERSION_NUM;
  return output_json;
}

function main() {
  let arg_parser = new ArgumentParser({
    description: 'Takes in a USX file and converts it into JSON',
  });

  arg_parser.add_argument('infile', {
    type: String,
    help: 'input USX(.xml) file',
  });

  arg_parser.add_argument('--output_path', {
    type: String,
    help: 'path to write the output file to',
    default: 'STDOUT',
  });

  let args = arg_parser.parse_args();
  let infile = args.infile;
  let outpath = args.output_path;

  try {
    let usx_data = fs.readFileSync(infile, 'utf-8');
    let parser = new DOMParser();
    let input_usx = parser.parseFromString(usx_data, 'text/xml');
    let output_json = usx_to_json(input_usx.documentElement);
    let json_str = JSON.stringify(output_json, null, 2);

    if (outpath === 'STDOUT') {
      console.log(json_str);
    } else {
      fs.writeFileSync(outpath, json_str, 'utf-8');
    }
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

if (require.main === module) {
  main();
}

