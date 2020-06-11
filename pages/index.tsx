import Axios from 'axios'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import ResultTable from '../components/ResultTable'
import { Result, Task } from '../types'

const Style = styled.div`
  .tab {
    padding: 8px;
    &[data-active='false'] {
      text-decoration: underline;
      cursor: pointer;
    }
  }
`

const IndexPage = () => {
  const [result, setResult] = useState<Result | null>(null)
  const [tasks, setTasks] = useState<Task | null>(null)
  const [selectId, setSelectId] = useState<string>('')
  const [isNight, setNight] = useState<boolean>(false)

  useEffect(() => {
    Axios.get<Task>('/tasks.json').then((data) => {
      setTasks(data.data)
    })
    updateResult()
    function updateResult() {
      Axios.get<Result>('/result.json').then((data) => {
        setResult(data.data)
      })
    }
    const si = setInterval(updateResult, 5 * 60 * 1000)
    return () => clearInterval(si)
  }, [])
  if (tasks === null || result == null) {
    return <p>loading</p>
  }
  const profileEnts = Object.entries(result)
  profileEnts.sort(() => -1)
  const pe = result[selectId]
  const profile = tasks.profiles.find((p) => p.id === selectId)
  return (
    <Layout title="Home">
      <Style>
        <h1>課題View</h1>
        <div>
          {tasks.profiles
            .map((p) => p.id)
            .map((pid) => (
              <span
                className="tab"
                data-active={pid === selectId}
                onClick={() => setSelectId(pid)}
              >
                {pid}
              </span>
            ))}
        </div>
        <div style={{ float: 'right' }}>
          <button
            style={{ border: 'none' }}
            onClick={() => setNight((v) => !v)}
          >
            Light/Dark
          </button>
        </div>
        {pe && <ResultTable pe={pe} profile={profile} />}
      </Style>
    </Layout>
  )
}

export default IndexPage
