import chokidar from 'chokidar'
import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import _ from 'lodash'
import rimraf from 'rimraf'
import { Profile, Result, Task } from '../types'

const workDir = 'vm/workspace'
const OUT_DIR = process.env.OUT_DIR || './out'

function fileService(outDir: string) {
  const resultFilePath = `${outDir}/result.json`
  const taskFilePath = `${outDir}/tasks.json`
  const result = JSON.parse(fs.readFileSync(resultFilePath, 'utf8')) as Result
  const tasks = JSON.parse(fs.readFileSync(taskFilePath, 'utf8')) as Task

  return {
    tasks,
    result,
    setResult: () => {
      fs.writeFileSync(resultFilePath, JSON.stringify(result))
    },
  } as const
}

export function client() {
  const { tasks, result, setResult } = fileService(OUT_DIR)
  const watchAllOption = { ignored: /^\./, persistent: true }
  const watcher = chokidar.watch(tasks.codeRoot, watchAllOption)

  const profileCheck = {}
  tasks.profiles.forEach((p) => (profileCheck[p.dir] = p))
  const execEx = (path: string) =>
    exec(
      path,
      result,
      (profileId: string) => profileCheck[profileId],
      setResult
    )

  return {
    start: () => {
      if (!checkDockerRunning()) {
        throw new Error('java docker not running')
      }
      resetOtherFiles(result)
      setResult()
      console.log(`watch start "${tasks.codeRoot}"`)
      watcher
        .on('add', execEx)
        .on('change', execEx)
        .on('unlink', function (path) {
          console.log('File', path, 'has been removed')
        })
        .on('error', function (error) {
          console.error('Error happened', error)
        })
      return watcher
    },
  }
}

function exec(
  path: string,
  result: Result,
  getProfile: (name: string) => Profile | undefined,
  saveResult: () => void
) {
  const paths = path.split('/')
  const filename = paths.pop()
  const studentId = paths.pop()
  const profileDir = paths.pop()
  if (!filename || !studentId || !profileDir) return
  const profile = getProfile(profileDir)

  if (!profile) return

  console.log({ profile })

  const file = profile.files.find((f) => new RegExp(f.regex).exec(filename))

  if (!file) {
    saveOtherFile(result, profile, studentId, filename)
    saveResult()
    return
  }
  const hash = filehash(path)

  const oldHash = _.get(result, [
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
    saveUserResult(result, profile, studentId, file.name, '', hash, 'OK')

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
    const status = execSync(cmd, { encoding: 'utf8' }).trim() as 'OK' | 'NG'
    saveUserResult(result, profile, studentId, file.name, status, hash, status)
  } else {
    const cmd = buildDockerCommand(`java ${filename} ${file.args || ''}`)
    const status = execSync(cmd, { encoding: 'utf8' })

    saveUserResult(
      result,
      profile,
      studentId,
      file.name,
      status,
      hash,
      status.match(file.expected) ? 'OK' : 'NG'
    )
  }
}

function initializeUser(result: Result, profileId: string, studentId: string) {
  if (!result[profileId]) result[profileId] = { users: {} }
  if (!result[profileId].users[studentId])
    result[profileId].users[studentId] = { results: {}, otherFiles: [] }
}

function saveOtherFile(
  results: Result,
  profile: Profile,
  studentId: string,
  name: string
) {
  initializeUser(results, profile.id, studentId)

  results[profile.id].users[studentId].otherFiles.push({ name })
}

function saveUserResult(
  result: Result,
  profile: Profile,
  studentId: string,
  name: string,
  text: string,
  hash: string,
  status: 'OK' | 'NG'
) {
  console.log(`log: ${profile}, ${studentId}, ${name}, ${text}`)

  initializeUser(result, profile.id, studentId)

  if (!result[profile.id].users[studentId].results[name]) {
    result[profile.id].users[studentId].results[name] = {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      hash,
      text,
      status,
    }
  } else {
    result[profile.id].users[studentId].results[name] = {
      ...result[profile.id].users[studentId].results[name],
      updatedAt: Date.now(),
      hash,
      text,
      status,
    }
  }
}

function resetOtherFiles(result: Result) {
  Object.entries(result).map(([key, pr]) => {
    Object.entries(pr.users).map(([key, user]) => {
      user.otherFiles = []
    })
  })
}

function filehash(path) {
  const hash = crypto.createHash('md5')
  hash.update(fs.readFileSync(path))
  return hash.digest('base64')
}

function buildDockerCommand(command) {
  return `docker exec -i java /bin/bash -c "cd /root/workspace && ${command}"`
}

function checkDockerRunning() {
  try {
    return (
      execSync(`docker exec -i java /bin/bash -c "echo OK"`, {
        encoding: 'utf8',
      }).trim() === 'OK'
    )
  } catch (e) {
    // console.error(e)
    return false
  }
}
