const chokidar = require('chokidar')
const fs = require('fs')
const child_process = require('child_process')
const homeDir =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']

const [_, _own, targetDir, targetFilename, programArg] = process.argv
const dir = `${homeDir}/Box/FI_netpro2020_kadai_uploadbox/${targetDir}`
const outFile = './out/result.json'

const watcher = chokidar.watch(dir, {
  ignored: /^\./,
  persistent: true,
})

console.log(`watch start "${dir}"`)
watcher
  .on('add', exec)
  .on('change', exec)
  .on('unlink', function (path) {
    console.log('File', path, 'has been removed')
  })
  .on('error', function (error) {
    console.error('Error happened', error)
  })

function exec(path) {
  const paths = path.split('/')
  const filename = paths.pop()
  if (filename !== targetFilename) return
  const id = paths.pop()
  const result = child_process.execSync(`java ${path} ${programArg}`, {
    encoding: 'utf8',
  })
  saveResult(id, result)
}

function saveResult(id, text) {
  const data = fs.readFileSync(outFile, 'utf8')
  const current = JSON.parse(data)
  // if (!current[id]) current[id] = {}
  current[id] = text
  fs.writeFileSync(outFile, JSON.stringify(current))
}
