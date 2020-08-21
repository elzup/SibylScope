import { readdirSync } from 'fs'
import { Plugin } from '../types'

export function loadPlugins(path: string): Record<string, Plugin> {
  const pluginIds = readdirSync(path)
  const plugins: Record<string, Plugin> = {}
  pluginIds.forEach((pid) => {
    const func = require(`../${path}/${pid}/index.ts`).default
    plugins[pid] = { id: pid, func }
  })

  return plugins
}
