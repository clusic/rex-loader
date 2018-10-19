const FileLoader = require('./lib/file-loader');
const Controller = require('./lib/controller');
const Middleware = require('./lib/middleware');
const Service = require('./lib/service');

const [dirs, compilers] = [
  Symbol('MvcLoader#dirs'),
  Symbol('MvcLoader#compilers')
];

module.exports = class MvcLoader {
  constructor() {
    this[dirs] = [];
    this[compilers] = [];
  }
  
  static get FileLoader() {
    return FileLoader;
  }
  
  static get Controller() {
    return Controller;
  }
  
  static get Middleware() {
    return Middleware;
  }
  
  static get Service() {
    return Service;
  }
  
  addCompiler(compiler) {
    if (typeof compiler !== 'function') throw new Error('Loader compiler must be an async function.');
    this[compilers].push(compiler);
    return this;
  }
  
  addComponent(dir) {
    if (this[dirs].indexOf(dir) === -1) this[dirs].push(dir);
    return this;
  }
  
  async compile() {
    const callbacks = [];
    for (let i = 0; i < this[compilers].length; i++) {
      const compiler = this[compilers][i];
      for (let j = 0; j < this[dirs].length; j++) {
        const callback = await compiler(this[dirs][j]);
        if (typeof callback === 'function') {
          callbacks.push(callback);
        }
      }
    }
    for (let j = 0 ; j < callbacks.length; j++) {
      await callbacks[j]();
    }
  }
};