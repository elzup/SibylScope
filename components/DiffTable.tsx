import { useState } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import styled from 'styled-components'
import { Profile, ProfileResult } from '../types'
import { CheckResultCell } from './CheckResultCell'
import { useLocalStorage } from './useLocalStorage'

type Props = {
  profile: Profile
  filename: string
  result: ProfileResult
  filterIds: string[]
}
type Review = {
  note: string
  point: number
}
function DiffTable({ result, filename, filterIds }: Props) {
  const [reviews, setReviews] = useLocalStorage<Record<string, Review>>(
    `diff_rev_${filename}`,
    {}
  )
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const entries =
    filterIds.length > 0
      ? filterIds.map((sid) => [sid, result.users[sid]] as const)
      : Object.entries(result.users)
  const selectedUser = result.users[selectedUid || '']
  const selectedCheck = selectedUser?.results[filename].checks?.['diff']
  const selectedCheckTest =
    selectedUser?.results[filename].checks?.['java-code-test']

  return (
    <Style>
      <div className="table-col">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>diff行数</th>
              <th>CodeTest</th>
              <th>採点</th>
              <th>ID</th>
              <th>点数</th>
            </tr>
          </thead>
          <tbody>
            {entries
              .sort(([ida], [idb]) => ida.localeCompare(idb))
              // .map((sid) => [sid, result.users[sid]] as const)
              .map(
                ([userId, user]) =>
                  [userId, user, user?.results[filename]] as const
              )
              .map(([userId, , file]) => (
                <tr
                  key={userId}
                  data-active={userId === selectedUid}
                  onClick={() => setSelectedUid(userId)}
                >
                  <th>{userId}</th>

                  <td>Code</td>
                  <td>
                    {file?.checks?.['diff'].text
                      ? file?.checks?.['diff'].text.split('\n').length
                      : '-'}
                  </td>
                  <td>
                    {[1, 2, 3, 4, 5].map((point) => (
                      <input
                        key={`p_${point}`}
                        type="radio"
                        name={`point_${filename}_${userId}`}
                        value={point}
                        defaultChecked={(reviews[userId]?.point || 0) === point}
                        onChange={(e) =>
                          setReviews((v) => ({
                            ...v,
                            [userId]: {
                              ...v[userId],
                              point: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    ))}
                  </td>
                  <CheckResultCell
                    check={file?.checks['java-code-test']}
                    pid="java-code-test"
                  />
                  <th>{userId}</th>
                  <td>{reviews[userId]?.point || 0}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className={'post-result'}>
        <p>{selectedUid}</p>
        {selectedCheckTest && (
          <div>
            {selectedCheckTest.status || ''}

            <div>
              <code>{selectedCheckTest.text}</code>
            </div>
          </div>
        )}
        {selectedCheck && (
          <SyntaxHighlighter language="diff" style={docco}>
            {selectedCheck.text || ''}
          </SyntaxHighlighter>
        )}
      </div>
    </Style>
  )
}

const Style = styled.div`
  display: grid;
  grid-template-columns: 640px 1fr;
  width: 100%;
  overflow-x: scroll;

  .table-col {
    height: 80vh;
    overflow-y: scroll;
  }
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
      &:last-child {
        border-right: 1px solid #c5c5c5;
      }
      pre {
        text-align: left;
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

export default DiffTable
