import { execSync } from 'child_process'
import { Check, FileInfo } from '../../types'

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
  const { path } = fileInfo
  let text = ''
  // diff コマンドの status は特殊で差分があると 1 のため try catch を使う
  try {
    execSync(`diff "${config.path}" "${path}" -U1 -w`).toString()
  } catch (err) {
    text = err.stdout.toString()
  }

  return {
    status: 'OK',
    text,
  }
}
