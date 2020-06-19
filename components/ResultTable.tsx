import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import styled from 'styled-components'
import { ProfileResult, Profile } from '../types'
import Axios from 'axios'

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
  td.post-result > div {
    display: grid;
  }
  [data-visible='false'] {
    display: none;
  }
`

type Props = {
  profile: Profile
  isViewTs: boolean
  isViewOther: boolean
}

function ResultTable({ profile, isViewTs, isViewOther }: Props) {
  const [result, setResult] = useState<ProfileResult | 'loading' | 'none'>(
    'loading'
  )

  useEffect(() => {
    updateResult()
    function updateResult() {
      Axios.get<ProfileResult>(`/result_${profile.id}.json`).then((data) => {
        setResult(data.data)
      })
    }
    const si = setInterval(updateResult, 5 * 60 * 1000)
    return () => clearInterval(si)
  }, [profile.id])
  if (result === 'loading') return <span>loading</span>
  if (result === 'none') return <span>no data</span>

  return (
    <Style>
      <table>
        <thead>
          <tr>
            <th></th>
            {profile.files.map((file) => (
              <th key={file.name}>{file.name}</th>
            ))}
            {isViewOther && <th>other files</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.users).map(([userId, user]) => (
            <tr key={userId}>
              <th>{userId}</th>
              {profile.files
                .map((file) => [file, user.results[file.name]] as const)
                .map(([_file, userfile], i) =>
                  userfile ? (
                    <td key={i} className={'post-result'}>
                      <div>
                        <span data-status={userfile.status}>
                          {userfile.status}
                        </span>
                        <span data-visible={isViewTs}>
                          ({format(userfile.createdAt, 'MM/dd HH:mm')})
                        </span>
                      </div>
                    </td>
                  ) : (
                    <td key={i} />
                  )
                )}
              {isViewOther && (
                <td data-visible={isViewOther}>
                  <div style={{ display: 'grid', width: '20vw' }}>
                    {user.otherFiles.map((file) => (
                      <span key={file.name}>{file.name}</span>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Style>
  )
}

export default ResultTable
