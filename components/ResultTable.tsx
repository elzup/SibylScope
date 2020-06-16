import { format } from 'date-fns'
import styled from 'styled-components'
import { ProfileResult, Profile } from '../types'

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

type Props = {
  pe: ProfileResult
  profile: Profile
}

function ResultTable({ profile, pe }: Props) {
  return (
    <Style>
      <table>
        <thead>
          <tr>
            <th></th>
            {profile.files.map((file) => (
              <th>{file.name}</th>
            ))}
            <th>other files</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pe.users).map(([userId, user]) => (
            <tr>
              <th>{userId}</th>
              {profile.files
                .map((file) => [file, user.results[file.name]] as const)
                .map(([_file, userfile]) =>
                  userfile ? (
                    <td>
                      <span data-status={userfile.status}>
                        {userfile.status}
                      </span>
                      <span>({format(userfile.createdAt, 'MM/dd HH:mm')})</span>
                    </td>
                  ) : (
                    <td />
                  )
                )}
              <td>
                <div style={{ display: 'grid', width: '20vw' }}>
                  {user.otherFiles.map((file) => (
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

export default ResultTable
