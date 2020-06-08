import chokidar from 'chokidar'
import fs from 'fs'
import { execSync } from 'child_process'
import _ from 'lodash'
const homeDir =
  process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME']

const outFile = './out/result.json'
const tasks = JSON.parse(fs.readFileSync('./out/tasks.json', 'utf8')) as Task
const dir = `${homeDir}/${tasks.boxRootFromHome}`

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
  if (file.skip) {
    saveResult(profile, studentId, file.name, '')
    return
  }

  const result = execSync(`java ${path} ${file.args || ''}`, {
    encoding: 'utf8',
  })
  saveResult(profile, studentId, file.name, result)
}

function saveResult(
  profile: Profile,
  studentId: string,
  name: string,
  text: string
) {
  console.log(`log: ${profile}, ${studentId}, ${name}, ${text}`)

  const data = fs.readFileSync(outFile, 'utf8')
  const current = JSON.parse(data) as Result
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
      text,
      status: 'OK',
    }
  } else {
    if (current[profile.id].users[studentId].results[name].text !== text) {
      current[profile.id].users[studentId].results[name] = {
        ...current[profile.id].users[studentId].results[name],
        updatedAt: Date.now(),
        text,
      }
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(current))
}
