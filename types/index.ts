export type ProfileFile = {
  name: string
  args?: string
  skip?: boolean
}
export type Profile = {
  id: string
  dir: string
  files: ProfileFile[]
}
export type Task = {
  boxRootFromHome: string
  profiles: Profile[]
}
export type Result = {
  [profileId: string]: {
    profile: Profile
    users: {
      [userId: string]: {
        results: {
          [name: string]: {
            createdAt: number
            updatedAt: number
            text: string
            status: 'OK' | 'NG'
          }
        }
      }
    }
  }
}
