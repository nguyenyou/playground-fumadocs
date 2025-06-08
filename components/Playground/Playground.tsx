import { FileExplorer } from './FileExplorer'
import PlaygroundClient from './PlaygroundClient'
import {
  createPlaygroundBuilder,
  parsePlaygroundFiles,
  PlaygroundPresetName,
  PlaygroundConfig,
} from './playground-utils'

type Props = {
  preset?: PlaygroundPresetName
  config?: PlaygroundConfig
  head?: string[]
  htmlAttr?: string
  files: string
}

export const Playground = async (props: Props) => {
  const { preset = 'vanilla', config, files: filesJson, head, htmlAttr  } = props
  const files = parsePlaygroundFiles(filesJson)

  const builder = config ? createPlaygroundBuilder(config) : createPlaygroundBuilder(preset)

  const srcDoc = await builder.build({ files, head, htmlAttr })

  return (
    <div>
      <PlaygroundClient srcDoc={srcDoc} />
      <FileExplorer files={files} />
    </div>
  )
}
