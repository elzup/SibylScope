import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Axios from 'axios'

const IndexPage = () => {
  const [works, setWorks] = useState<{ [id: string]: string }>({})

  useEffect(() => {
    Axios.get('/result.json').then((data) => {
      setWorks(data.data)
    })
  }, [])

  return (
    <Layout title="Home">
      <h1>課題View</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {Object.entries(works).map(([v, k]) => (
          <div
            key={k}
            style={{
              overflow: 'scroll',
              border: 'solid gray 1px',
              padding: '4px',
            }}
          >
            <h4>{k}</h4>
            <code>
              <pre>{v}</pre>
            </code>
          </div>
        ))}
      </div>
    </Layout>
  )
}

export default IndexPage
