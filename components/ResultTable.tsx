import { format } from 'date-fns'
import styled from 'styled-components'
import { Profile, ProfileResult } from '../types'

const Style = styled.div`
  width: 100%;
  overflow-x: scroll;
  table {
    border-spacing: 0;
    border: solid 2px lightgray;
    tr {
      &:nth-child(odd) {
        background: #f1f1f1;
      }
    }
    th,
    td {
      border-left: 1px solid #c5c5c5;
      border-top: 1px solid #c5c5c5;
      min-width: 80px;
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
  result: ProfileResult
}

function ResultPage({ profile, isViewTs, isViewOther, result }: Props) {
  return (
    <Style>
      <table>
        <thead>
          <tr>
            <th></th>
            {profile.files.map((file) => (
              <th key={file.name}>{file.name}</th>
            ))}
            <th data-visible={isViewOther}>other files</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.users)
            .sort(([ida], [idb]) => ida.localeCompare(idb))
            // .map((sid) => [sid, result.users[sid]] as const)
            .map(([userId, user]) => (
              <tr key={userId}>
                <th>{userId}</th>
                {profile.files
                  .map((file) => [file, user?.results[file.name]] as const)
                  .map(([_file, userfile], i) =>
                    userfile ? (
                      <td key={i} className={'post-result'}>
                        <div>
                          {Object.entries(userfile.checks).map(([k, v]) => (
                            <span key={k}>
                              {k}: {v.status}
                            </span>
                          ))}
                          <span data-visible={isViewTs}>
                            ({format(userfile.createdAt, 'MM/dd HH:mm')})
                          </span>
                        </div>
                      </td>
                    ) : (
                      <td key={i} />
                    )
                  )}
                <td data-visible={isViewOther}>
                  <div style={{ display: 'grid', width: '20vw' }}>
                    {user?.otherFiles.map((file) => (
                      <span key={file.name}>{file.name}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Style>
  )
}

export default ResultPage
