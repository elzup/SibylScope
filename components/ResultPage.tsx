import Axios from 'axios'
import { useEffect, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import { Profile, ProfileResult } from '../types'
import DiffTable from './DiffTable'
import ResultTable from './ResultTable'

type Props = {
  profile: Profile
  isViewTs: boolean
  isViewOther: boolean
}

function ResultPage(props: Props) {
  const { profile } = props
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

  const diffFiles = profile.files.filter((p) => 'diff' in (p.plugins || {}))

  return (
    <div>
      <Tabs>
        <TabList>
          <Tab>提出状況</Tab>
          {diffFiles.map((df) => (
            <Tab>{df.name}[diff]</Tab>
          ))}
        </TabList>

        <TabPanel>
          <ResultTable {...props} result={result} />
        </TabPanel>
        {diffFiles.map((df) => (
          <TabPanel>
            <DiffTable {...props} result={result} filename={df.name} />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  )
}

export default ResultPage
