import chokidar from 'chokidar'
import crypto from 'crypto'
import fs from 'fs'
import _ from 'lodash'
import {
  Checks,
  Plugin,
  Profile,
  ProfileResult,
  Result,
  Task,
  FileInfo,
  ProfileFile,
} from '../types'
import { loadPlugins } from './loadPlugins'
import { loadTasks } from './loadTasks'
import { insert, notionEnabled } from './notionClient'

function fileService(outDir: string, tasks: Task) {
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
  function initializeUser(profileId: string, studentId: string) {
    if (!result[profileId]) result[profileId] = { users: {} }
    if (!result[profileId].users[studentId])
      result[profileId].users[studentId] = { results: {}, otherFiles: [] }
  }

  function saveOtherFile(profile: Profile, studentId: string, name: string) {
    initializeUser(profile.id, studentId)
    result[profile.id].users[studentId].otherFiles.push({ name })
  }

  function saveUserResult(
    profileId: string,
    { studentId }: FileInfo,
    name: string,
    hash: string,
    checks: Checks
  ) {
    console.log(`log: ${profileId}, ${studentId}, ${name}`)
    initializeUser(profileId, studentId)
    const checkResult = checks['java-code-test']
      ? `${checks['java-code-test'].status} ${checks[
          'java-code-test'
        ].text.substring(0, 20)}`
      : 'Submit'
    if (notionEnabled) {
      insert(studentId, name, checkResult, hash)
    }

    const now = Date.now()
    if (!result[profileId].users[studentId].results[name]) {
      result[profileId].users[studentId].results[name] = {
        createdAt: now,
        updatedAt: now,
        hash,
        checks,
      }
    } else {
      result[profileId].users[studentId].results[name] = {
        ...result[profileId].users[studentId].results[name],
        updatedAt: now,
        hash,
        checks,
      }
    }
  }
  function setResult(profileId?: string) {
    const ids = profileId ? [profileId] : tasks.profiles.map((p) => p.id)
    ids.forEach((pid) => {
      const resultProfilePath = `${outDir}/result_${pid}.json`

      fs.writeFileSync(resultProfilePath, JSON.stringify(result[pid]))
    })
  }

  function resetOtherFiles() {
    Object.entries(result).map(([pid, pr]) => {
      Object.entries(pr.users).map(([uk, user]) => {
        result[pid].users[uk].otherFiles = []
      })
    })
  }
  resetOtherFiles()

  return {
    result,
    saveUserResult,
    saveOtherFile,
    setResult,
  } as const
}

export function client(outDir: string, watchDir: string, pluginDir: string) {
  const tasks = loadTasks(`${outDir}/tasks.json`)
  console.log(tasks.profiles)
  const { result, setResult, saveUserResult, saveOtherFile } = fileService(
    outDir,
    tasks
  )
  const plugins = loadPlugins(pluginDir)
  console.log('plugins')
  console.log(plugins)

  const watchAllOption = { ignored: /^\./, persistent: true }
  const watcher = chokidar.watch(watchDir, watchAllOption)

  const profileCheck = {}
  tasks.profiles
    .filter((p) => p.enabled)
    .forEach((p) => (profileCheck[p.dir] = p))
  console.log({ profileCheck })

  const execEx = (path: string) => {
    const fileInfo = parsePath(path, watchDir)

    if (!fileInfo) return
    const { filename, studentId, profileId, filePath } = fileInfo
    console.log({ filename, studentId })

    const profile = profileCheck[profileId]

    if (!filename || !studentId || !profileId || !profile) {
      return
    }

    const file = profile.files.find((f) => {
      // NOTE: .file も直で regex にしている

      const path = f.regex || f.name
      const target = filePath + filename

      return new RegExp(path.toLowerCase()).exec(target.toLowerCase())
    })

    if (!file) {
      saveOtherFile(profile, studentId, filePath + filename)
      setResult(profile.id)
      return
    }
    const hash = filehash(path)

    const oldHash = _.get(
      result,
      [profile.id, 'users', studentId, 'results', file.name, 'hash'],
      ''
    ) as string

    const changed = hash !== oldHash
    if (!changed) {
      console.log('skip')
      // no change
      return
    }

    const res = exec(fileInfo, file, plugins)

    saveUserResult(profile.id, fileInfo, file.name, hash, res.checks)
    // saveUserResult(result, profile, studentId, file.name, status, hash, status)
    setResult(profile.id)
  }
  return {
    start: () => {
      // if (!checkDockerRunning()) {
      //   throw new Error('java docker not running')
      // }
      setResult()
      console.log(`watch start "${watchDir}"`)
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

function parsePath(path: string, watchDir): FileInfo | false {
  const paths = path.replace(watchDir, '').split('/')

  const profileId = paths.shift()
  // const profileId = 'Exam'
  const studentId = paths.shift()
  const filename = paths.pop()
  if (!filename || !studentId || !profileId) return false

  return {
    path,
    filename,
    studentId,
    profileId,
    filePath: paths.join('/') + '/',
  }
}

type ExecResult = {
  checks: Checks
}
function exec(
  fileInfo: FileInfo,
  file: ProfileFile,
  plugins: Record<string, Plugin>
): ExecResult {
  const checks: Checks = {}
  checks['exists'] = { status: 'OK', text: 'OK' }
  Object.entries(file.plugins || {}).forEach(([pluginId, pluginArg]) => {
    if (!plugins[pluginId]) return
    checks[pluginId] = plugins[pluginId].func(fileInfo, pluginArg)
  })
  return { checks }
}

function filehash(path) {
  const hash = crypto.createHash('md5')
  hash.update(fs.readFileSync(path))
  const hashstr = hash.digest('base64')
  // console.log(path, hashstr)
  return hashstr
}
