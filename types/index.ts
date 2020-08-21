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
  regex?: string
  plugins: {
    [pluginId: string]: unknown
  }
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
