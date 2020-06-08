import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Axios from 'axios'
import { Result, Task } from '../types'
import styled from 'styled-components'
import { format } from 'date-fns'

const Style = styled.div`
  width: 100%;
  overflow-x: scroll;
  table {
    border-spacing: 0;
    tr {
      &:nth-child(odd) {
        background: #f1f1f1;
      }
    }
    th,
    td {
      border-left: 1px solid #c5c5c5;
      border-top: 1px solid #c5c5c5;
      width: 10vw;
      text-align: center;
      span {
        font-size: 0.8rem;
        color: #444;
        padding-left: 4px;
        &[data-status] {
          color: orange;
        }
        &[data-status='OK'] {
          color: green;
        }
      }
      &:last-child {
        border-right: 1px solid #c5c5c5;
      }
    }
    tr:last-child {
      th,
      td {
        border-bottom: 1px solid #c5c5c5;
      }
    }
  }
`

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
      {pe && (
        <Style>
          <table>
            <thead>
              <tr>
                <th></th>
                {pe.profile.files.map((file) => (
                  <th>{file.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(pe.users).map(([userId, user]) => (
                <tr>
                  <th>{userId}</th>
                  {pe.profile.files
                    .map((file) => [file, user.results[file.name]] as const)
                    .map(([file, userfile]) =>
                      userfile ? (
                        <td>
                          <span data-status={userfile.status}>
                            {userfile.status}
                          </span>
                          <span>
                            ({format(userfile.createdAt, 'MM/dd HH:mm')})
                          </span>
                        </td>
                      ) : (
                        <td />
                      )
                    )}
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
        </Style>
      )}
    </Layout>
  )
}

export default IndexPage
