import glob, json
from lxml import etree
import usx_to_json

usx_samples_path = '../../samples/*/origin.xml'

for usx_path in glob.glob(usx_samples_path):
    outpath = "/".join(usx_path.split('/')[:-1])+"/proposed.json"
    usx = etree.parse(usx_path)
    dict_out = usx_to_json.usx_to_json(usx.getroot())
    with open(outpath, 'w', encoding='utf-8') as outfile:
        outfile.write(json.dumps(dict_out, indent=2))


