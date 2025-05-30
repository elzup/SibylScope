import rimraf from 'rimraf'
import { mkdirSync, copyFileSync } from 'fs'
import { execSync } from 'child_process'
import { FileInfo, Check } from '../../types'

type Config = {
  path: string
  additionalFiles?: string[]
}

const isConfig = (config: unknown): config is Config => {
  if (typeof config !== 'object' || config === null) return false
  if (typeof config['path'] !== 'string') return false
  if (
    config['additionalFiles'] &&
    typeof config['additionalFiles'] !== 'object'
  )
    return false
  return true
}

export default function main(fileInfo: FileInfo, config: unknown): Check {
  if (!isConfig(config)) {
    throw new Error('invalid profile config, plugin arg.')
    // NOTE: throw
  }
  const { path, filename } = fileInfo
  const workDir = process.cwd() + '/vm/workspace'

  rimraf.sync(workDir)
  mkdirSync(workDir)
  const workFilePath = workDir + '/' + filename
  copyFileSync(path, workFilePath)

  // copy
  const testFileName = popFilename(config.path)
  const testFilePath = `${workDir}/${testFileName}`
  copyFileSync(config.path, testFilePath)

  if (config.additionalFiles) {
    config.additionalFiles.forEach((filePath) => {
      const fileName = popFilename(filePath)
      const path = `${workDir}/${fileName}`
      copyFileSync(filePath, path)
      execSync(`sed -i -e '/^package/d' ${path}`)
    })
  }
  execSync(`export LANG=C`)
  execSync(`export LC_CTYPE=C`)
  execSync(`LC_ALL=C sed -i -e '/^package/d' ${workDir + '/' + filename}`)
  execSync(`LC_ALL=C sed -i -e '/^package/d' ${workDir + '/' + testFileName}`)

  const className = testFileName.split('.')[0] || ''
  const cmd = buildDockerCommand(
    `javac -encoding UTF-8 ${testFileName} && java ${className}`
  )
  // saveUserResult(result, profile, studentId, file.name, status, hash, status)
  // setResult(profile.id)
  return exec(cmd)
}

type ErrorResult = {
  status: 'OK' | 'NG'
  errno: string
  stderr: string
}
const isErrorResult = (e: unknown): e is ErrorResult =>
  typeof e === 'object' && e !== null && 'error' in e

function exec(cmd: string) {
  try {
    const text = execSync(cmd, {
      encoding: 'utf8',
      timeout: 10000,
      killSignal: 'SIGKILL',
    }).trim()
    return {
      status: text === 'OK' ? 'OK' : 'NG',
      text,
    } as const
  } catch (e) {
    if (isErrorResult(e)) {
      return {
        status: 'NG' as const,
        text: `${e.errno} ${e.stderr}`,
      }
    }
    console.log(e)
    return {
      status: 'NG' as const,
      text: `${0} unknown error`,
    }
  }
}

const popFilename = (path: string) => path.split('/').pop() || ''
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
