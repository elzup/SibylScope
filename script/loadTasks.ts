import { readFileSync } from 'fs'
import { Task } from '../types'

export function loadTasks(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as Task
}
