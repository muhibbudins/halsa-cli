const chalk = require('chalk')
const path = require('path')
const build = require('./build')
const http = require('http')
const reload = require('reload')
const express = require('express')
const chokidar = require('chokidar')
const package = require('../package')
const { pathExistsSync } = require('fs-extra')

module.exports = (halsa, project, config) => {
  const app = express()
  const target = path.join(project, '.halsa')
  const port = config['port'] || 3000
  const reloadable = [
    path.join(project, '/pages/'),
    path.join(project, '/layouts/'),
    path.join(project, '/themes/'),
    path.join(project, '/static/')
  ]

  if (!pathExistsSync(target)) {
    build(project)
  }

  app.set('port', port)
  app.get('/', (req, res) => {
    res.sendFile(path.join(target, 'index.html'))
  })

  app.use('/', express.static(target))

  let first = true
  const watcher = chokidar.watch(reloadable, {
    ignored: /^\./,
    persistent: true
  })
  const server = http.createServer(app)
  const reloadServer = reload(app)
  const restart = (file) => {
    if (first) {
      console.log(`Watching file ${file.replace(project, '')} changed`)
    } else {
      console.log(`File ${file.replace(project, '')} changed`)
    }

    build(project)

    reloadServer.reload()
  }

  setTimeout(() => {
    first = !first
  }, 2000)

  watcher
    .on('add', (path) => {restart(path)})
    .on('change', (path) => restart(path))
    .on('unlink', (path) => restart(path))
    .on('error', (path) => {
      process.exit(0)
    })

  server.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })
}