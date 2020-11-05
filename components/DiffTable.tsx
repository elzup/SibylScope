import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
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

type Props = {
  profile: Profile
  filename: string
  result: ProfileResult
}

function DiffTable({ result, filename }: Props) {
  return (
    <Style>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(result.users)
            .sort(([ida], [idb]) => ida.localeCompare(idb))
            // .map((sid) => [sid, result.users[sid]] as const)
            .map(
              ([userId, user]) =>
                [userId, user, user?.results[filename]] as const
            )
            .map(([userId, , file]) => (
              <tr key={userId}>
                <th>{userId}</th>
                <td className={'post-result'}>
                  <SyntaxHighlighter language="diff" style={docco}>
                    {file?.checks?.['diff'].text || ''}
                  </SyntaxHighlighter>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Style>
  )
}

export default DiffTable
