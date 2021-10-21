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
      {check?.status}
      <div>{check?.text.substring(0, 10)}</div>
    </td>
  )
}
