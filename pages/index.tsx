import axios from 'axios'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import Layout from '../components/Layout'
import ResultPage from '../components/ResultPage'
import { useLocalStorage } from '../components/useLocalStorage'
import { Profile, Task } from '../types'
import _ from 'lodash'
import React from 'react'

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
  const [profileById, setProfileById] = useState<Record<
    string,
    Profile
  > | null>(null)
  const [selectId, setSelectId] = useLocalStorage<string>('select-tab', '')
  const [isViewTs, setViewTs] = useLocalStorage<boolean>('is-view-ts', false)
  const [isViewOther, setViewOther] = useLocalStorage<boolean>(
    'is-view-other',
    false
  )

  useEffect(() => {
    axios.get<Task>('tasks.json').then((data) => {
      setProfileById(_.keyBy(data.data.profiles, 'id'))
    })
  }, [])
  if (profileById === null) {
    return <p>loading</p>
  }
  const profile = profileById[selectId]
  return (
    <Layout title="Home">
      <Style>
        <h1>課題View</h1>
        <div>
          {Object.values(profileById)
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
          <ResultPage
            showScoring
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
