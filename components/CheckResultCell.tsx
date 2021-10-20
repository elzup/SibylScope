import { Check } from '../types'
import React from 'react'

type Props = {
  check?: Check
  pid: string
}
export const CheckResultCell = ({ check, pid }: Props) => {
  if (!check) return <td key={pid} />
  if (check.status !== 'NG') return <td key={pid}>{check?.status}</td>

  return (
    <td key={pid}>
      {check?.status}{' '}
      {check?.text?.length <= 10 ? (
        <span>{check?.text}</span>
      ) : (
        <details>
          <summary>詳細</summary>
          {check?.text}
        </details>
      )}
    </td>
  )
}
