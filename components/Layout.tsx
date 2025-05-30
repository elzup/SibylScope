import Head from 'next/head'
import * as React from 'react'

type Props = {
  title?: string
}

const Layout: React.FunctionComponent<Props> = ({
  children,
  title = 'This is the default title',
}) => (
  <div style={{ fontFamily: 'Hiragino Maru Gothic ProN' }}>
    <Head>
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="robots" content="noindex, nofollow" />
    </Head>
    <header>
      <nav></nav>
    </header>
    {children}
    <footer>
      <hr />
      {/* <span>I'm here to stay (Footer)</span> */}
    </footer>
  </div>
)

export default Layout
