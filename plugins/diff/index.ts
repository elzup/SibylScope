import rimraf from 'rimraf'
import { mkdirSync, copyFileSync } from 'fs'
import { execSync } from 'child_process'
import { FileInfo, Check } from '../../types'

type Config = {
  path: string
}

const isConfig = (config: unknown): config is Config => {
  if (typeof config !== 'object' || config === null) return false
  if (typeof config['path'] !== 'string') return false
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

  execSync(`sed -i -e '/^package/d' ${workDir + '/' + filename}`)

  // copy
  const testFileName = popFilename(config.path)
  const testFilePath = `${workDir}/${testFileName}`
  copyFileSync(config.path, testFilePath)
  const className = testFileName.split('.')[0] || ''
  const cmd = buildDockerCommand(`javac ${testFileName} && java ${className}`)
  // saveUserResult(result, profile, studentId, file.name, status, hash, status)
  // setResult(profile.id)
  const text = execSync(cmd, { encoding: 'utf8' }).trim()

  return {
    status: text as 'OK' | 'NG',
    text,
  }

  // } else if (file.case === 'run-test') {
  // const cmd = buildDockerCommand(`java ${filename} ${file.args || ''}`)
  // const resultText = execSync(cmd, { encoding: 'utf8' })

  // return {
  //   status: resultText.trim().match(file.expected) ? 'OK' : 'NG',
  //   text:
  // }

  // saveUserResult(
  //   result,
  //   profile,
  //   studentId,
  //   file.name,
  //   resultText,
  //   hash,
  //   resultText.trim().match(file.expected) ? 'OK' : 'NG'
  // )
  // setResult(profile.id)
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
