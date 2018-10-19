const path = require('path');
const FileLoader = require('./file-loader');

module.exports = app => {
  app.Controller = {};
  return async function ControllerCompiler(component) {
    const file = new FileLoader();
    const items = await file.match('**/*.js').parse(path.resolve(component, 'app', 'controller'));
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const properties = item.properties;
      const controllerExports = item.exports;
      properties.reduce((target, property, index) => {
        const _properties = properties.slice(0, index + 1).join('.');
        if (index === properties.length - 1) {
          if (property in target) throw new Error(`can't overwrite property '${_properties}'`);
          target[property] = controllerExports;
        } else if (!target[property]) {
          target[property] = {};
        }
        return target[property];
      }, app.Controller);
    }
    return () => Object.freeze(app.Controller);
  }
};