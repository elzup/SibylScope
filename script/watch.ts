import chokidar from 'chokidar'
import fs from 'fs'
import { execSync } from 'child_process'
import _ from 'lodash'
import { stringify } from 'querystring'
import crypto from 'crypto'
import { CLIENT_RENEG_LIMIT } from 'tls'

const homeDir =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']

const outFile = './out/result.json'
const tasks = JSON.parse(fs.readFileSync('./out/tasks.json', 'utf8')) as Task
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
  args?: string
  skip?: boolean
}
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

  console.log(profileDir)
  console.log(filename)
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
  if (file.skip) {
    saveResult(profile, studentId, file.name, '', hash)
    return
  }

  const result = execSync(`java ${path} ${file.args || ''}`, {
    encoding: 'utf8',
  })
  saveResult(profile, studentId, file.name, result, hash)
}

function saveResult(
  profile: Profile,
  studentId: string,
  name: string,
  text: string,
  hash: string
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
      status: 'OK',
    }
  } else {
    if (current[profile.id].users[studentId].results[name].hash !== hash) {
      current[profile.id].users[studentId].results[name] = {
        ...current[profile.id].users[studentId].results[name],
        updatedAt: Date.now(),
        hash,
        text,
      }
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(current))
}

function filehash(path) {
  const hash = crypto.createHash('md5')
  hash.update(fs.readFileSync(path))
  return hash.digest('base64')
}
