'use client'
import * as React from 'react'
import PreviewContainer from './PreviewContainer'

type Props = {
  srcDoc: string
}

export default function PlaygroundClient({ srcDoc }: Props) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null)

  const previewIframe = (
    <iframe
      srcDoc={srcDoc}
      className="w-full h-full"
      sandbox="allow-scripts allow-modals"
      title="Playground"
      ref={iframeRef}
    />
  )

  return <PreviewContainer expand previewIframe={previewIframe} previewIframeRef={iframeRef} />
}
