import { client } from '../script/client'
import * as fs from 'fs'
import rimraf from 'rimraf'

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec))

const codeDir = __dirname + '/codeRoot'
const resultDir = __dirname + '/resultRoot'
const pluginDir = 'plugins'

beforeAll(() => {
  fs.mkdirSync(codeDir + '/Chapter4/user-a', { recursive: true })
  fs.copyFileSync(
    __dirname + '/sample/result.json',
    __dirname + '/resultRoot/result.json'
  )
})

jest.setTimeout(20000) // in milliseconds

test('run java task', async () => {
  const cli = client(resultDir, codeDir, 'plugins')
  const watcher = cli.start()

  fs.copyFileSync(
    __dirname + '/sample/Calc.java',
    codeDir + '/Chapter4/user-a/Calc.java'
  )
  await sleep(5000)
  const result = JSON.parse(
    fs.readFileSync(resultDir + '/result_Chap4.json', 'utf-8')
  )

  expect(result).toMatchInlineSnapshot(`
    Object {
      "users": Object {
        "user-a": Object {
          "otherFiles": Array [],
          "results": Object {
            "Calc.java": Object {
              "checks": Object {
                "exists": Object {
                  "status": "OK",
                  "text": "OK",
                },
                "java-code-test": Object {
                  "status": "OK",
                  "text": "OK",
                },
              },
              "createdAt": 1598004248276,
              "hash": "KMB5t+1FVh/kJrg8G60UEw==",
              "updatedAt": 1598004284400,
            },
          },
        },
      },
    }
  `)
  watcher.close()
})

afterAll(() => {
  rimraf.sync(codeDir)
})
