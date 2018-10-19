const fs = require('fs');
const path = require('path');
const globby = require('globby');
const is = require('is-type-of');
const utils = require('@clusic/utils');
module.exports = class FileLoader {
  constructor(options = {}) {
    this.files = [];
    this.options = options;
    if (options.match) this.match(options.match);
    if (options.ignore) this.ignore(options.ignore);
  }
  
  match(matcher) {
    if (!is.array(matcher)) matcher = [matcher];
    this.files.push(...matcher);
    return this;
  }
  
  ignore(matcher) {
    if (!is.array(matcher)) matcher = [matcher];
    matcher = matcher.filter(f => !!f).map(f => '!' + f);
    this.files.push(...matcher);
    return this;
  }
  
  parse(directories, callback) {
    if (is.function(directories)) directories = directories();
    if (!is.array(directories)) directories = [ directories ];
    const items = [];
    for (const directory of directories) {
      const filePaths = globby.sync(this.files, { cwd: directory });
      for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        const fileFullPath = path.join(directory, filePath);
        if (!fs.statSync(fileFullPath).isFile()) continue;
        const properties = this.getProperties(filePath);
        // const pathName = directory.split(/\/|\\/).slice(-1) + '.' + properties.join('.');
        let resultExports = utils.loadFile(fileFullPath);
        if (is.function(callback)) {
          const result = callback(resultExports);
          if (result) resultExports = result;
        }
        if (!resultExports) continue;
        // if (is.class(resultExports)) {
        //   resultExports.prototype.__DEFINE_PATH_NAME__ = pathName;
        //   resultExports.prototype.__DEFINE_FULL_PATH__ = fileFullPath;
        // }
        items.push({ fileFullPath, properties, exports: resultExports });
      }
    }
    return items;
  }
  
  getProperties(filePath) {
    const { caseStyle } = this.options;
    if (is.function(caseStyle)) {
      const result = caseStyle(filePath);
      if (!is.array(result)) throw new Error(`caseStyle expect an array, but got ${result}`);
      return result;
    }
    return this.defaultHump(filePath);
  }
  
  defaultHump(filePath) {
    const { caseStyle } = this.options;
    const properties = filePath.substring(0, filePath.lastIndexOf('.')).split('/');
    return properties.map(property => {
      if (!/^[a-z][a-z0-9_-]*$/i.test(property)) throw new Error(`${property} is not match 'a-z0-9_-' in ${filePath}`);
      property = property.replace(/[_-][a-z0-9]/ig, s => s.substring(1).toUpperCase());
      let first = property.charAt(0);
      const next = property.substring(1);
      if (caseStyle === 'lower') {
        first = first.toLowerCase();
      } else {
        first = first.toUpperCase();
      }
      return first + next;
    });
  }
};