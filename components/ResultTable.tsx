import { format } from 'date-fns'
import styled from 'styled-components'
import { Plugin, Profile, ProfileResult } from '../types'
import { CheckResultCell } from './CheckResultCell'

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
    &[data-state='true'] {
      color: green;
    }
  }
  [data-visible='false'] {
    display: none;
  }
`

type Props = {
  profile: Profile
  isViewTs: boolean
  isViewOther: boolean
  filterIds: string[]
  result: ProfileResult
}
function pluginFilter(
  plugins?: Record<string, Plugin>
): Record<string, Plugin> {
  const viewPlugins = { ...(plugins || {}) }
  delete viewPlugins['diff']
  return viewPlugins
}

function ResultPage({
  profile,
  isViewTs,
  isViewOther,
  result,
  filterIds,
}: Props) {
  // const plugsins = profile.files.map((file) =>
  //   Object.entries(pluginFilter(file.plugins))
  // )
  const entries =
    filterIds.length > 0
      ? filterIds.map((sid) => [sid, result.users[sid]] as const)
      : Object.entries(result.users)
  const records = entries.sort(([ida], [idb]) => ida.localeCompare(idb))

  const csvText = [
    'sid\t' + profile.files.map((file) => file.name).join('\t'),
    ...records.map(([sid, user]) => {
      return (
        sid +
        '\t' +
        profile.files
          .map((file) => (user?.results[file.name] ? '1' : '0'))
          .join('\t') +
        '\t' +
        user?.otherFiles?.map((f) => f.name)?.join(',')
      )
    }),
  ].join('\n')

  return (
    <Style>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            {profile.files.map((file) => (
              <>
                <th>{file.name}</th>
                {Object.entries(pluginFilter(file.plugins)).map(
                  ([pid, plugin]) => (
                    <th key={plugin.id}>_{pid}</th>
                  )
                )}
              </>
            ))}
            <th data-visible={isViewOther}>other files</th>
          </tr>
        </thead>
        <tbody>
          {records.map(([userId, user]) => (
            <tr key={userId}>
              <th>{userId}</th>

              {profile.files
                .map((file) => [file, user?.results[file.name]] as const)
                .map(([file, userfile]) => (
                  <>
                    <td className="post-result">
                      <div data-state={!!userfile}>
                        {userfile ? 'OK' : 'NG'}
                        {userfile && (
                          <span data-visible={isViewTs}>
                            ({format(userfile.createdAt, 'MM/dd HH:mm')})
                          </span>
                        )}
                      </div>
                    </td>
                    {Object.entries(pluginFilter(file.plugins)).map(([pid]) => (
                      <CheckResultCell
                        pid={pid}
                        check={userfile?.checks[pid]}
                      />
                    ))}
                  </>
                ))}
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
      <pre>
        <code>{csvText}</code>
      </pre>
    </Style>
  )
}

export default ResultPage
