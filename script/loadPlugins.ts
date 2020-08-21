import { readdirSync } from 'fs'
import { Plugin } from '../types'

export function loadPlugins(path: string): Record<string, Plugin> {
  const pluginDirs = readdirSync(path, { withFileTypes: true })

  const plugins: Record<string, Plugin> = {}
  pluginDirs
    .filter((v) => v.isDirectory())
    .forEach(({ name: pid }) => {
      const func = require(process.cwd() + `/${path}/${pid}/index.ts`).default
      plugins[pid] = { id: pid, func }
    })

  return plugins
}
