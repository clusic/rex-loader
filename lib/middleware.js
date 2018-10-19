const path = require('path');
const FileLoader = require('./file-loader');

module.exports = app => {
  app.Middleware = {};
  return async function MiddlewareCompiler(component) {
    const file = new FileLoader();
    const items = await file.match('**/*.js').parse(path.resolve(component, 'app', 'middleware'), object => {
      if (object.length === 1) return object(app);
      return object;
    });
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
      }, app.Middleware);
    }
    return () => Object.freeze(app.Middleware);
  }
};