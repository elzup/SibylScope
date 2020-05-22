const chokidar = require('chokidar')
const fs = require('fs')
const child_process = require('child_process')

const dir = '/Users/hiro/Box/FI_netpro2020_kadai_uploadbox/第2回課題_締切_05_22'
// const dir = './hoge'
const outFile = './out/result.json'
const targetFilename = 'XmasTree.java'

const watcher = chokidar.watch(dir, {
  ignored: /^\./,
  persistent: true,
})

console.log('watch start')
function exec(path) {
  const paths = path.split('/')
  const filename = paths.pop()
  if (filename !== targetFilename) return
  const id = paths.pop()
  const result = child_process.execSync(`java ${path} 20 20`, {
    encoding: 'utf8',
  })
  saveResult(id, result)
}

watcher
  .on('add', exec)
  .on('change', exec)
  .on('unlink', function (path) {
    console.log('File', path, 'has been removed')
  })
  .on('error', function (error) {
    console.error('Error happened', error)
  })

function saveResult(id, text) {
  const data = fs.readFileSync(outFile, 'utf8')
  const current = JSON.parse(data)
  current[id] = text
  console.log(current)
  fs.writeFileSync(outFile, JSON.stringify(current))
}
