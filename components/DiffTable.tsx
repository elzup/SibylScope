import { useRef } from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import styled from 'styled-components'
import { Profile, ProfileResult } from '../types'
import { useLocalStorage } from './useLocalStorage'

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
  const ref = useRef<HTMLDivElement>(null)

  const openAll = () => {
    if (!ref.current) return
    const res = Array.prototype.slice.call(
      ref.current.getElementsByTagName('details')
    )
    res.forEach((e) => {
      e.setAttribute('open', 'true')
    })
  }
  const entries =
    filterIds.length > 0
      ? filterIds.map((sid) => [sid, result.users[sid]] as const)
      : Object.entries(result.users)

  return (
    <Style ref={ref}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>diff行数</th>
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
              <tr key={userId}>
                <th>{userId}</th>

                <td className={'post-result'}>
                  {file?.checks?.['diff'].text && (
                    <details>
                      <summary>diff code</summary>
                      <SyntaxHighlighter language="diff" style={docco}>
                        {file?.checks?.['diff'].text || ''}
                      </SyntaxHighlighter>
                    </details>
                  )}
                </td>
                <td>
                  {file?.checks?.['diff'].text
                    ? file?.checks?.['diff'].text.split('\n').length
                    : '-'}
                </td>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={reviews[userId]?.point || 0}
                    onChange={(e) =>
                      setReviews((v) => ({
                        ...v,
                        [userId]: {
                          ...v[userId],
                          point: Number(e.target.value),
                        },
                      }))
                    }
                    step="1"
                  />
                </td>
                <th>{userId}</th>
                <td>{reviews[userId]?.point || 0}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Style>
  )
}

export default DiffTable
