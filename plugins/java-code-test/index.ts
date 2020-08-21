type Config = {
  path: string
}

const isConfig = (config: unknown): config is Config => {
  if (typeof config !== 'object' || config === null) return false
  if (typeof config['path'] !== 'string') return false
  return true
}

export default function main(config: unknown) {
  if (!isConfig(config)) {
    return
    // NOTE: throw
  }
}
