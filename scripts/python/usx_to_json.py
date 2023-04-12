import argparse
import json
from lxml import etree

def usx_to_json(input_usx_elmt):
    '''Accepts an XML object of USX and returns a JSON corresponding to it.
    Traverses the children, recursively'''
    key = input_usx_elmt.tag
    text = None
    dict_out = {}
    dict_out[key]  = dict(input_usx_elmt.attrib)
    if input_usx_elmt.text and input_usx_elmt.text.strip() != "":
        text = input_usx_elmt.text.strip()
    children = input_usx_elmt.getchildren() 
    if len(children)>0:
        dict_out[key]['children'] = []
        if text:
            dict_out[key]['children'].append(text)
        for child in children:
            dict_out[key]['children'].append(usx_to_json(child))
            if child.tail and child.tail.strip() != "":
                dict_out[key]['children'].append(child.tail)
    elif text:
        dict_out[key]['text'] = text
    return dict_out

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
