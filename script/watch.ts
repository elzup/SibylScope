import { client } from './client'

const outDir = process.argv[2]
const watchPath = process.argv[3]
if (!outDir || !watchPath) {
  throw new Error('ts-node watch.ts {output path} {watch path}')
} else {
  client(outDir, watchPath).start()
}
