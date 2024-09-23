const concat = require('concat');
const UglifyJS = require("uglify-js");
const fs = require('fs');
const pluginsToBuild = require("../src/js/plugins.js");

const uglifyFlag = (  
    process.argv.indexOf('--uglify') > -1 ? true : false
);

const outputIndex = process.argv.indexOf('--output');
let outputValue;

if (outputIndex > -1) {
  outputValue = process.argv[outputIndex + 1];
}

outputFile = (outputValue || console.error("No destination file specified. Plugins.js not built"));

if(uglifyFlag) {
    concat(pluginsToBuild).then(result => {
        fs.writeFileSync(outputFile, UglifyJS.minify(result, { mangle: false }).code, "utf8")
    });

} else {
    concat(pluginsToBuild, outputFile);
}