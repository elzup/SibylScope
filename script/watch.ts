import { execSync } from 'child_process'
import chokidar from 'chokidar'
import crypto from 'crypto'
import fs from 'fs'
import _ from 'lodash'
import rimraf from 'rimraf'
import { Profile, Result, Task } from '../types'

const homeDir =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']
const workDir = 'vm/workspace'

const OUT_DIR = process.env.OUT_DIR || './out'
const outFile = `${OUT_DIR}/result.json`
const taskFile = `${OUT_DIR}/tasks.json`
const tasks = JSON.parse( fs.readFileSync(taskFile, 'utf8')) as Task

const dir = `${homeDir}/${tasks.boxRootFromHome}`

const data = fs.readFileSync(outFile, 'utf8')
const current = JSON.parse(data) as Result
resetOtherFiles()

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
  const studentId = paths.pop()
  const profileDir = paths.pop()
  const profile = tasks.profiles.find((p) => p.dir === profileDir)

  if (!profile) return

  const file = profile.files.find((f) => new RegExp(f.regex).exec(filename))

  if (!file) {
    saveOtherFile(profile, studentId, filename)
    return
  }
  const hash = filehash(path)

  const oldHash = _.get(current, [
    profile.id,
    'users',
    studentId,
    'results',
    file.name,
    'hash',
  ])

  const changed = hash !== oldHash
  if (!changed) return console.log('skip')
  console.log(profileDir)
  console.log(filename)
  console.log({ hash, oldHash })
  if (file.case === 'check') {
    saveResult(profile, studentId, file.name, '', hash, 'OK')
    return
  }

  rimraf.sync(workDir)
  fs.mkdirSync(workDir)
  fs.copyFileSync(path, workDir + '/' + filename)

  if (file.case === 'load-test') {
    // copy
    const tfs = file.testFile.split('/')
    const testFileName = tfs.pop() || ''
    const testFilePath = `${workDir}/${testFileName}`
    fs.copyFileSync(file.testFile, testFilePath)
    const className = testFileName.split('.')[0] || ''
    const cmd = buildDockerCommand(`javac ${testFileName} && java ${className}`)
    const result = execSync(cmd, { encoding: 'utf8' }).trim() as 'OK' | 'NG'
    saveResult(profile, studentId, file.name, result, hash, result)
  } else {
    const cmd = buildDockerCommand(`java ${filename} ${file.args || ''}`)
    const result = execSync(cmd, { encoding: 'utf8' })

    saveResult(
      profile,
      studentId,
      file.name,
      result,
      hash,
      result.match(file.expected) ? 'OK' : 'NG'
    )
  }
}

function initializeUser(profileId: string, studentId: string) {
  if (!current[profileId]) current[profileId] = { users: {} }
  if (!current[profileId].users[studentId])
    current[profileId].users[studentId] = { results: {}, otherFiles: [] }
}

function saveOtherFile(profile: Profile, studentId: string, name: string) {
  initializeUser(profile.id, studentId)

  current[profile.id].users[studentId].otherFiles.push({ name })
  fs.writeFileSync(outFile, JSON.stringify(current))
}

function saveResult(
  profile: Profile,
  studentId: string,
  name: string,
  text: string,
  hash: string,
  status: 'OK' | 'NG'
) {
  console.log(`log: ${profile}, ${studentId}, ${name}, ${text}`)

  initializeUser(profile.id, studentId)

  if (!current[profile.id].users[studentId].results[name]) {
    current[profile.id].users[studentId].results[name] = {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hash,
      text,
      status,
    }
  } else {
    current[profile.id].users[studentId].results[name] = {
      ...current[profile.id].users[studentId].results[name],
      updatedAt: Date.now(),
      hash,
      text,
      status,
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(current))
}
function resetOtherFiles() {
  Object.entries(current).map(([key, pr])=> {
    Object.entries(pr.users).map(([key, user])=> {
      user.otherFiles = []
    })
  })
  fs.writeFileSync(outFile, JSON.stringify(current))
}

function filehash(path) {
  const hash = crypto.createHash('md5')
  hash.update(fs.readFileSync(path))
  return hash.digest('base64')
}

function buildDockerCommand(command) {
  return `docker exec -i java /bin/bash -c "cd /root/workspace && ${command}"`
}
