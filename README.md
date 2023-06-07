# nice-usfm-json
Discussions, schema and other artefacts around the dream of a JSON format that respects the USFM spec and that developers don't hate. Too much. Most of the time.


## How to setup and run

Clone the repo

```
git clone https://github.com/mvh-solutions/nice-usfm-json.git
```
### Python
:warning: The python scripts require Python 3.10 or greater.

Set up a virtual environment
```
cd nice-usfm-json/scripts/python
python3 -n venv ENV
source ENV/bin/activate
pip install -r requirements.txt
```
> NOTE: This can be deactivated using the command `deactivate` once you finish the work. Closing the terminal will also exit the environment.

Run the converter
```
python usx_to_json.py <file_path>
```
> Example: python usx_to_json.js ../../samples/chapter-verse/origin.xml

```
usage: usx_to_json.py [-h] [--output_path OUTPUT_PATH] infile

Takes in a USX file and converts it into a JSON

positional arguments:
  infile                input USX(.xml) file

options:
  -h, --help            show this help message and exit
  --output_path OUTPUT_PATH
                        path to write the output file to
```

### Javascript

Install dependencies

```
cd nice-usfm-json/scripts/javascript
npm install .
```
Run the converter
```
node usx-to-usj.js <filepath>
```
> Example: node usx-to-usj.js ../../samples/chapter-verse/origin.xml

```
usage: usx-to-usj.js [-h] [--output_path OUTPUT_PATH] infile

Takes in a USX file and converts it into JSON

positional arguments:
  infile                input USX(.xml) file

optional arguments:
  -h, --help            show this help message and exit
  --output_path OUTPUT_PATH
                        path to write the output file to
```