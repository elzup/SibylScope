import Axios from 'axios'
import { useEffect, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs'
import { Profile, ProfileResult } from '../types'
import DiffTable from './DiffTable'
import ResultTable from './ResultTable'
import { useLocalStorage } from './useLocalStorage'

type Props = {
  profile: Profile
  isViewTs: boolean
  isViewOther: boolean
  showScoring?: boolean
}

function ResultPage(props: Props) {
  const { profile, showScoring = false } = props
  const [result, setResult] = useState<ProfileResult | 'loading' | 'none'>(
    'loading'
  )
  const [filterIds, setFilterIds] = useLocalStorage<string[]>('filterIds', [])

  useEffect(() => {
    updateResult()
    function updateResult() {
      Axios.get<ProfileResult>(`result_${profile.id}.json`).then((data) => {
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
          {showScoring &&
            diffFiles.map((df, i) => (
              <Tab key={`tab${i}`}>{df.name}[diff]</Tab>
            ))}
        </TabList>

        <TabPanel>
          <ResultTable {...props} result={result} filterIds={filterIds} />
        </TabPanel>
        {diffFiles.map((df, i) => (
          <TabPanel key={`df-tab${i}`}>
            <DiffTable
              {...props}
              result={result}
              filename={df.name}
              filterIds={filterIds}
            />
          </TabPanel>
        ))}
      </Tabs>
      <h5>StudentId Filter(改行区切り)</h5>
      <textarea
        defaultValue={filterIds.join('\n')}
        onChange={(e) => {
          const idText = e.target.value.trim()
          if (idText === '') return setFilterIds([])

          const sids = idText.split('\n')
          setFilterIds(sids)
        }}
      ></textarea>

      {filterIds && <p> オン({filterIds.length}) </p>}
    </div>
  )
}

export default ResultPage
