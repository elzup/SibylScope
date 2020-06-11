import { execSync } from 'child_process'
import chokidar from 'chokidar'
import crypto from 'crypto'
import fs from 'fs'
import _ from 'lodash'

const homeDir =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']
const workDir = './vm/workspace'

const OUT_DIR = process.env.OUT_DIR || './out'
const outFile = `${OUT_DIR}/result.json`
const tasks = JSON.parse(
  fs.readFileSync(`${OUT_DIR}/tasks.json`, 'utf8')
) as Task

const dir = `${homeDir}/${tasks.boxRootFromHome}`

const data = fs.readFileSync(outFile, 'utf8')
const current = JSON.parse(data) as Result

const watcher = chokidar.watch(dir, {
  ignored: /^\./,
  persistent: true,
})

type ProfileFile = {
  name: string
  regex: string
} & (
  | {
      case: 'check'
    }
  | {
      case: 'load-test'
      testFile: string
    }
  | {
      case: 'run-test'
      args?: string
      expected: string
    }
)
type Profile = {
  id: string
  dir: string
  files: ProfileFile[]
}
type Task = {
  boxRootFromHome: string
  profiles: Profile[]
}
type Result = {
  [profileId: string]: {
    profile: Profile
    users: {
      [userId: string]: {
        results: {
          [name: string]: {
            createdAt: number
            updatedAt: number
            text: string
            hash: string
            status: 'OK' | 'NG'
          }
        }
      }
    }
  }
}

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

  if (!file) return
  const hash = filehash(path)

  const oldHash = _.get(current, [
    profile.id,
    'users',
    studentId,
    'results',
    file.name,
    'hash',
  ])

  console.log({ hash, oldHash })

  const changed = hash === oldHash
  if (!changed) return console.log('skip')
  console.log(profileDir)
  console.log(filename)
  console.log({ hash, oldHash })
  if (file.case === 'check') {
    saveResult(profile, studentId, file.name, '', hash, 'OK')
    return
  }

  fs.rmdirSync(workDir)
  fs.mkdirSync(workDir)
  fs.copyFileSync(path, workDir)

  if (file.case === 'load-test') {
    // copy
    fs.copyFileSync(file.testFile, workDir)
    const tfs = file.testFile.split('/')
    const testFileName = tfs.pop()
    const cmd = buildDockerCommand(`java ${workDir}/${testFileName}`)
    const result = execSync(cmd, { encoding: 'utf8' }) as 'OK' | 'NG'
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

function saveResult(
  profile: Profile,
  studentId: string,
  name: string,
  text: string,
  hash: string,
  status: 'OK' | 'NG'
) {
  console.log(`log: ${profile}, ${studentId}, ${name}, ${text}`)

  if (!current[profile.id]) {
    current[profile.id] = { profile, users: {} }
  }
  if (!current[profile.id].users[studentId]) {
    current[profile.id].users[studentId] = { results: {} }
  }

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

function filehash(path) {
  const hash = crypto.createHash('md5')
  hash.update(fs.readFileSync(path))
  return hash.digest('base64')
}

function buildDockerCommand(command) {
  return `docker exec -i java /bin/bash -c "cd /root && ${command}"`
}
