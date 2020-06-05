import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Axios from 'axios'
import { Result, Task } from '../types'

const IndexPage = () => {
  const [result, setResult] = useState<Result | null>(null)
  const [tasks, setTasks] = useState<Task | null>(null)
  const [isNight, setNight] = useState<boolean>(false)

  useEffect(() => {
    Axios.get<Result>('/result.json').then((data) => {
      setResult(data.data)
    })
    Axios.get<Task>('/tasks.json').then((data) => {
      setTasks(data.data)
    })
  }, [])
  if (tasks === null || result == null) {
    return <p>loading</p>
  }
  const profileEnts = Object.entries(result)
  profileEnts.sort(() => -1)
  return (
    <Layout title="Home">
      <h1>課題View</h1>
      <div style={{ float: 'right' }}>
        <button style={{ border: 'none' }} onClick={() => setNight((v) => !v)}>
          Light/Dark
        </button>
      </div>
      {profileEnts.map(([key, pe]) => (
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
        >
          <table>
            <thead>
              <tr>
                <th></th>
                {tasks.profiles
                  .find((p) => p.id === pe.profile.id)
                  .files.map((file) => (
                    <th>{file.name}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(pe.users).map(([userId, user]) => (
                <tr>
                  <th>{userId}</th>
                </tr>
                // <div
                //   key={userId}
                //   style={{
                //     overflow: 'scroll',
                //     border: 'solid gray 1px',
                //     padding: '4px',
                //     ...(isNight
                //       ? { background: '#210047', color: 'white' }
                //       : {}),
                //   }}
                // >
                // <code>
                //   <pre style={{ fontSize: 'calc(200px /20)' }}>{user}</pre>
                // </code>
                // </div>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Layout>
  )
}

export default IndexPage

const comp3 = (a, b) => {
  const [aid, aact] = a[2].split(':')
  const [i1, i2] = aid.split('_').map(Number)
  const ati = i1 * 1000 + i2 * 10

  const [bid, bact] = b[2].split(':')
  const [b1, b2] = bid.split('_').map(Number)
  const bti = b1 * 1000 + b2 * 10
  if (ati === bti) {
    return a[0] - b[0]
  }

  return ati - bti
}
