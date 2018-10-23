const path = require('path');
const is = require('is-type-of');
const FileLoader = require('./file-loader');
const ServiceLoader = Symbol('ServiceLoader');

module.exports = app => {
  app.Service = {};
  let defined = false;
  return async function ServiceCompiler(component) {
    const file = new FileLoader();
    const items = await file.match('**/*.js').parse(path.resolve(component, 'app', 'service'));
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
      }, app.Service);
    }
    if (!defined) {
      Object.defineProperty(app.context, 'Service', {
        get() {
          if (this[ServiceLoader]) return this[ServiceLoader];
          this[ServiceLoader] = {};
          createContext(this, app.Service, this[ServiceLoader]);
          return this[ServiceLoader];
        }
      });
      defined = true;
    }
    return () => Object.freeze(app.Service);
  }
};

function createContext(ctx, service, target) {
  for (const i in service) {
    if (!is.class(service[i])) {
      target[i] = service[i];
      createContext(ctx, service[i], target[i]);
    } else {
      const context = new Proxy(service[i], {
        get(obj, prop) {
          const res = new obj(ctx);
          if (is.function(res[prop])) return res[prop].bind(res);
          return res[prop];
        }
      });
      target[i] = context;
    }
  }
}