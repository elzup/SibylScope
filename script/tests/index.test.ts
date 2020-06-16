import watcher from '../watch'
import * as fs from 'fs'
import rimraf from 'rimraf'

test('run java task', () => {
  fs.mkdirSync(__dirname + '/codeRoot/Chapter4/user-a', { recursive: true })

  fs.copyFileSync(
    __dirname + '/sample/Calc.java',
    __dirname + '/codeRoot/Chapter4/user-a/Clac.java'
  )
  const result = JSON.parse(
    fs.readFileSync(__dirname + '/resultRoot/result.json', 'utf-8')
  )
  expect(result).toMatchInlineSnapshot()
})

afterAll(() => {
  rimraf.sync('codeRoot')
  watcher.close()
})
