import Axios from 'axios'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import ResultTable from '../components/ResultTable'
import { Result, Task } from '../types'
import { useLocalStorage } from '../components/useLocalStorage'

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
  const [tasks, setTasks] = useState<Task | null>(null)
  const [selectId, setSelectId] = useLocalStorage<string>('select-tab', '')
  const [isViewTs, setViewTs] = useLocalStorage<boolean>('is-view-ts', false)
  const [isViewOther, setViewOther] = useLocalStorage<boolean>(
    'is-view-other',
    false
  )

  useEffect(() => {
    Axios.get<Task>('/tasks.json').then((data) => {
      setTasks(data.data)
    })
  }, [])
  if (tasks === null) {
    return <p>loading</p>
  }
  const profile = tasks.profiles.find((p) => p.id === selectId)
  return (
    <Layout title="Home">
      <Style>
        <h1>課題View</h1>
        <div>
          {tasks.profiles
            .filter((p) => p.enabled)
            .map((p) => p.id)
            .map((pid) => (
              <span
                key={pid}
                className="tab"
                data-active={pid === selectId}
                onClick={() => setSelectId(pid)}
              >
                {pid}
              </span>
            ))}
        </div>
        <div style={{ float: 'right' }}>
          <label>
            <input
              type="checkbox"
              defaultChecked={isViewOther}
              onClick={() => setViewOther((v) => !v)}
            />
            OtherFile
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked={isViewTs}
              onClick={() => setViewTs((v) => !v)}
            />
            Timestamp
          </label>
        </div>
        {profile && (
          <ResultTable
            isViewOther={isViewOther}
            isViewTs={isViewTs}
            profile={profile}
          />
        )}
      </Style>
    </Layout>
  )
}

export default IndexPage
