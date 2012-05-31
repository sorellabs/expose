/// index.js --- Strings the exposé server together
//
// Copyright (c) 2012 Quildreen Motta
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation files
// (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge,
// publish, distribute, sublicense, and/or sell copies of the Software,
// and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/// Module expose

//// == Dependencies ===================================================
var express = require('express')
var path    = require('path')
var fs      = require('fs')
var glob    = require('glob')
var map     = require('khaos/src/collection/map')
var string  = require('khaos/src/collection/string')

var Base    = require('boo').Base

require('express-namespace')


//// == Configuration ==================================================
var root = path.join(__dirname, '..')


function load_config() {
  var filepath = path.join(root, 'data', 'config', 'server.json')
  return JSON.parse(fs.readFileSync(filepath, 'utf-8')) }


function configure(app) {
  app.configure(function() {
    app.use(express.bodyParser())
    app.use(express.static(path.join(root, 'www'))) })}


//// == Modules ========================================================
var Module = Base.derive({
  init:
  function _init(namespace, path) {
    this.namespace = namespace
    this.path      = path
    return this }

, install:
  function _install(app) {
    app.namespace( '/' + this.namespace
                 , function(){
                     require(path.join(root, this.path))(app) }.bind(this))
    return this }
})

function make_module(namespace, pathname) {
  namespace = string.format(namespace, { name: path.basename(pathname) })
  return Module.make(namespace, pathname) }

function make_modules_from_path(namespace, pathname) {
  var dirs = glob.sync(pathname, { cwd: root })
  return dirs.map(make_module.bind(null, namespace)) }

function load_modules(config) {
  return map.map(config.modules, make_modules_from_path) }

function flatten_modules(module_map) {
  return map.reduce( module_map
                   , []
                   , function(list, modules) {
                       return list.concat(modules) })}

function install_modules(app, modules) {
  modules = flatten_modules(modules)
  map.each(modules, function(module){ module.install(app) })
  return modules }



//// == Main ===========================================================
function run() {
  var app    = express.createServer()
  var config = load_config()
  configure(app)
  install_modules(app, load_modules(config))
  app.listen(config.port)
  console.log('-— Exposé is ready on http://' + config.domain + ':' + config.port) }


//// == Exports ========================================================
module.exports = { configure   : configure
                 , load_config : load_config
                 , run         : run }