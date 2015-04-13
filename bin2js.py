#!/usr/bin/env python2
import sys

head = """(function(window) {
  var ASSETS = {};
  
  var Asset = function(name, str) {
    this.name = name;
    this.str = str;
  }

  Asset.prototype = {
    asUint8Array: function() {
      var i = this.str.length,
          buffer = new ArrayBuffer(this.str.length),
          array = new Uint8Array(buffer);
      while(i--) {
        array[i] = this.str.charCodeAt(i);
      }
      return array;
    }
  }

"""

asset = "  ASSETS['%(filename)s'] = new Asset('%(filename)s', '%(data)s');\n"

foot = """

  window.getAsset = function(name) {
    if (!ASSETS.hasOwnProperty(name)) {
      throw 'Asset not found ' + name;
    }
    return ASSETS[name];
  }
  window.listAssets = function() {

  }
})(window);"""

if len(sys.argv) < 2:
    print("Usage: {0} <filenames...>".format(sys.argv[0]))
    sys.exit(2)

input_filenames = sys.argv[1:]
output_filename = 'js/assets.js'

def read_to_hex_string(filename):
    s = ""
    with open(filename, 'rb') as infile:
        for c in infile.read():
            s += "\\x{0:02x}".format(ord(c), 'x')
    return s

with open(output_filename, 'w') as outfile:
    outfile.write(head)
    for filename in input_filenames:
        outfile.write(asset % dict(filename=filename, data=read_to_hex_string(filename)))
    outfile.write(foot)

