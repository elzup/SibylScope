import { execSync } from 'child_process'
import chokidar from 'chokidar'
import crypto from 'crypto'
import fs from 'fs'
import _ from 'lodash'
import rimraf from 'rimraf'
import { Profile, ProfileResult, Result, Task } from '../types'

const workDir = 'vm/workspace'

function fileService(outDir: string) {
  const taskFilePath = `${outDir}/tasks.json`
  const tasks = JSON.parse(fs.readFileSync(taskFilePath, 'utf8')) as Task

  const result: Result = {}
  tasks.profiles.forEach((profile) => {
    const resultProfilePath = `${outDir}/result_${profile.id}.json`
    if (fs.existsSync(resultProfilePath)) {
      result[profile.id] = JSON.parse(
        fs.readFileSync(resultProfilePath, 'utf8')
      ) as ProfileResult
    } else {
      result[profile.id] = { users: {} }
    }
  })
  return {
    tasks,
    result,
    setResult: (profileId?: string) => {
      const ids = profileId ? [profileId] : tasks.profiles.map((p) => p.id)
      ids.forEach((pid) => {
        const resultProfilePath = `${outDir}/result_${pid}.json`

        fs.writeFileSync(resultProfilePath, JSON.stringify(result[pid]))
      })
    },
  } as const
}

export function client(outDir: string, watchDir: string) {
  const { tasks, result, setResult } = fileService(outDir)
  const watchAllOption = { ignored: /^\./, persistent: true }
  const watcher = chokidar.watch(watchDir, watchAllOption)

  const profileCheck = {}
  tasks.profiles.forEach((p) => (profileCheck[p.dir] = p))
  const execEx = (path: string) =>
    exec(
      path,
      result,
      (profileId: string) => profileCheck[profileId],
      setResult,
      watchDir
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

function parsePath(path: string, watchDir) {
  const paths = path.replace(watchDir, '').split('/')

  paths.shift()
  const profileDir = paths.shift()
  const studentId = paths.shift()
  const filename = paths.pop()

  return {
    filename,
    studentId,
    profileDir,
    filePath: paths.join('/') + '/',
  } as const
}

function exec(
  path: string,
  result: Result,
  getProfile: (name: string) => Profile | undefined,
  setResult: (profileId: string) => void,
  watchDir: string
) {
  const { filename, studentId, profileDir, filePath } = parsePath(
    path,
    watchDir
  )
  // console.log({ filename, studentId, profileDir, filePath })

  if (!filename || !studentId || !profileDir) return
  const profile = getProfile(profileDir)

  if (!profile) return

  const file = profile.files.find((f) =>
    new RegExp((f.regex || f.name).toLowerCase()).exec(
      (filePath + filename).toLowerCase()
    )
  )

  if (!file) {
    saveOtherFile(result, profile, studentId, filePath + filename)
    setResult(profile.id)
    return
  }
  const hash = filehash(path)

  const oldHash = _.get(result, [
    profile.id,
    'users',
    studentId,
    'results',
    filePath + file.name,
    'hash',
  ])

  const changed = hash !== oldHash
  if (!changed) return console.log('skip')
  if (file.case === 'check') {
    saveUserResult(result, profile, studentId, file.name, '', hash, 'OK')
    setResult(profile.id)
    return
  }

  rimraf.sync(workDir)
  fs.mkdirSync(workDir)
  fs.copyFileSync(path, workDir + '/' + filename)

  execSync(`sed -i -e '/^package/d' ${workDir + '/' + filename}`)

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
    setResult(profile.id)
  } else {
    const cmd = buildDockerCommand(`java ${filename} ${file.args || ''}`)
    const resultText = execSync(cmd, { encoding: 'utf8' })

    saveUserResult(
      result,
      profile,
      studentId,
      file.name,
      resultText,
      hash,
      resultText.trim().match(file.expected) ? 'OK' : 'NG'
    )
    setResult(profile.id)
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
  console.log(`log: ${profile.id}, ${studentId}, ${name}, ${text}`)

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
