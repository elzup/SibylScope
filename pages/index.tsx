import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Axios from 'axios'

const IndexPage = () => {
  const [works, setWorks] = useState<{ [id: string]: string }>({})
  const [isNight, setNight] = useState<boolean>(false)

  useEffect(() => {
    Axios.get('/result.json').then((data) => {
      setWorks(data.data)
    })
  }, [])
  const workEnts = Object.entries(works)
  workEnts.sort(([k], [k2]) => (k === k2 ? 0 : k < k2 ? -1 : 1))
  return (
    <Layout title="Home">
      <h1>課題View</h1>
      <div style={{ float: 'right' }}>
        <button style={{ border: 'none' }} onClick={() => setNight((v) => !v)}>
          Light/Dark
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {workEnts.map(([k, v]) => (
          <div
            key={k}
            style={{
              overflow: 'scroll',
              border: 'solid gray 1px',
              padding: '4px',
              ...(isNight ? { background: '#210047', color: 'white' } : {}),
            }}
          >
            <h4 style={{ margin: '4px 0 0 0' }}>{k}</h4>
            <code>
              <pre style={{ fontSize: 'calc(200px /20)' }}>{v}</pre>
            </code>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default IndexPage
