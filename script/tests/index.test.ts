import { client } from '../client'
import * as fs from 'fs'
import rimraf from 'rimraf'

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec))

beforeAll(() => {
  fs.mkdirSync(__dirname + '/codeRoot/Chapter4/user-a', { recursive: true })
  fs.copyFileSync(
    __dirname + '/sample/result.json',
    __dirname + '/resultRoot/result.json'
  )
})

test('run java task', async () => {
  const cli = client()
  const watcher = cli.start()

  fs.copyFileSync(
    __dirname + '/sample/Calc.java',
    __dirname + '/codeRoot/Chapter4/user-a/Calc.java'
  )
  // fs.watch(__dirname + '/resultRoot/result.json', () => {
  const result = JSON.parse(
    fs.readFileSync(__dirname + '/resultRoot/result.json', 'utf-8')
  )

  expect(result).toMatchInlineSnapshot(`Object {}`)
  watcher.close()
  // })
})

afterAll(() => {
  rimraf.sync(__dirname + '/codeRoot')
  // rimraf.sync(__dirname + '/resultRoot/result.json')
})
