export type ProfileResult = {
  users: {
    [userId: string]: {
      results: {
        [name: string]: {
          createdAt: number
          updatedAt: number
          hash: string
          text: string
          status: 'OK' | 'NG'
        }
      }
      otherFiles: { name: string }[]
    }
  }
}
export type Result = {
  [profileId: string]: ProfileResult
}

export type ProfileFile = {
  name: string
  regex: string
} & (
  | {
      case: 'check'
    }
  | {
      case: 'load-test'
      testFile: string
    }
  | {
      case: 'run-test'
      args?: string
      expected: string
    }
)
export type Profile = {
  id: string
  dir: string
  files: ProfileFile[]
}

export type Task = {
  boxRootFromHome: string
  profiles: Profile[]
}
