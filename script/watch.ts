import { client } from './client'

// const OUT_DIR = process.argv[0]

const outDir = process.argv[2]
const watchPath = process.argv[3]
if (!outDir || !watchPath) {
  throw new Error('ts-node watch.ts {output path} {watch path}')
} else {
  client(outDir, watchPath).start()
}
