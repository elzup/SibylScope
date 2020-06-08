import Axios from 'axios'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import ResultTable from '../components/ResultTable'
import { Result, Task } from '../types'

const IndexPage = () => {
  const [result, setResult] = useState<Result | null>(null)
  const [tasks, setTasks] = useState<Task | null>(null)
  const [selectId, setSelectId] = useState<string>('')
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
  const pe = result[selectId]
  return (
    <Layout title="Home">
      <h1>課題View</h1>
      <div>
        {profileEnts
          .map(([key, pe]) => pe.profile.id)
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
        <button style={{ border: 'none' }} onClick={() => setNight((v) => !v)}>
          Light/Dark
        </button>
      </div>
      {pe && <ResultTable pe={pe} />}
    </Layout>
  )
}

export default IndexPage
