export type Check = {
  status: 'OK' | 'CL' | 'NG'
  text: string
}
export type Checks = { [id: string]: Check }
export type ProfileResult = {
  users: {
    [userId: string]: {
      results: {
        [name: string]: {
          createdAt: number
          updatedAt: number
          hash: string
          checks: { [id: string]: Check }
        }
      }
      otherFiles: { name: string }[]
    }
  }
}
export type Result = {
  [profileId: string]: ProfileResult
}

export type Plugin = {
  id: string
  func: (fileInfo: FileInfo, arg: unknown) => Check
}
export type ProfileFile = {
  name: string
  regex?: string
  plugins?: Record<string, Plugin>
  // diffFile?: string
  // loadTestFile: string
  // expected?: {
  //   args?: string
  //   out: string
  // }
}

export type Profile = {
  id: string
  enabled: boolean
  dir: string
  files: ProfileFile[]
}

export type Task = {
  profiles: Profile[]
}

export type FileInfo = {
  filename: string
  studentId: string
  filePath: string
  path: string
  profileId: string
}
