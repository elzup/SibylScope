import { readdirSync } from 'fs'

export function loadPlugins(path: string) {
  const pluginIds = readdirSync(path)
  const plugins = pluginIds.map((pid) => {
    const func = require(`../${path}/${pid}/index.ts`).default
    return { id: pid, func }
  })

  return plugins
}
