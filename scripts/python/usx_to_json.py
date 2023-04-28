import argparse
import json
from lxml import etree

VERSION_NUM = "0.0.1-alpha.1"
SPEC_NAME = "JOUST" # for Javascript Objects for USFM Syntax Trees


NO_NESTING = ["book:id", "chapter:c", "verse:v", "para:ide", "para:h1", "para:h2", "para:h3",
            "para:h", "para:toc1", "para:toc2", "para:toc3", "para:toca1", "para:toca2",
            "para:toca3", "para:usfm", "figure:fig"]

def convert_usx(input_usx_elmt):
    '''Accepts an XML object of USX and returns a Dict corresponding to it.
    Traverses the children, recursively'''
    key = input_usx_elmt.tag
    text = None
    out_obj = {}
    action = "append"
    attribs = dict(input_usx_elmt.attrib)
    if "style" in attribs:
        key = key+":"+attribs['style']
        del attribs['style']
    out_obj["type"]  = key
    out_obj =  out_obj | attribs
    if input_usx_elmt.text and input_usx_elmt.text.strip() != "":
        text = input_usx_elmt.text.strip()
    children = input_usx_elmt.getchildren() 
    if key in NO_NESTING:
        if text:
            out_obj['text'] = text
        if key in ["chapter:c", "verse:v"]:
            if "altnumber" in out_obj:
                out_obj = [out_obj]
                out_obj.append({
                    "type": f"char:{key[-1]}a",
                    "content": [out_obj[0]['altnumber']]
                    })
                del out_obj[0]['altnumber']
                action = "merge"
            if "pubnumber" in out_obj:
                if not isinstance(out_obj, list):
                    out_obj = [out_obj]
                out_obj.append({
                    "type": f"para:{key[-1]}p",
                    "content": [out_obj[0]['pubnumber']]
                    })
                del out_obj[0]['pubnumber']
                action = "merge"
    else:
        out_obj['content'] = []
        if text:
            out_obj['content'].append(text)
        for child in children:
            child_dict, what_to_do = convert_usx(child)
            match what_to_do:
                case "append":
                    out_obj['content'].append(child_dict)
                case "merge":
                    out_obj['content'] += child_dict
                case "ignore":
                    pass
                case _:
                    pass
            if child.tail and child.tail.strip() != "":
                out_obj['content'].append(child.tail)
    if "eid" in out_obj:
        action = "ignore"
    return out_obj, action

def usx_to_json(input_usx):
    '''The core function for the process.
    input: parsed XML element for the whole USX
    output: dict object as per the JSON schema'''
    output_json, _ = convert_usx(input_usx)
    output_json['type'] = SPEC_NAME
    output_json['version'] = VERSION_NUM
    return output_json

def main():
    '''Handles the command line requests.
    Reads USX from a file and writes JSON to a file or prints to console'''
    arg_parser = argparse.ArgumentParser(
        description='Takes in a USX file and converts it into a JSON')
    arg_parser.add_argument('infile', type=str, help='input USX(.xml) file')
    arg_parser.add_argument('--output_path', type=str, help='path to write the output file to',
        default="STDOUT")

    infile = arg_parser.parse_args().infile
    outpath = arg_parser.parse_args().output_path

    try:
        input_usx = etree.parse(infile)
    except Exception as exe:
        raise Exception("Input file path or the USX file seems not valid!") from exe

    output_json = usx_to_json(input_usx.getroot())
    json_str = json.dumps(output_json, indent=2)
    if outpath == 'STDOUT':
        print(json_str)
    else:
        with open(outpath, 'w', encoding='utf-8') as out_file:
            out_file.write(json_str)

if __name__ == '__main__':
    main()
