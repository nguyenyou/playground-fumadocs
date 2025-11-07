import { FileExplorer } from "./FileExplorer";
import PlaygroundClient from "./PlaygroundClient";
import {
  createPlaygroundBuilder,
  parsePlaygroundFiles,
  PlaygroundPresetName,
  PlaygroundConfig,
} from "./playground-utils";

type Props = {
  preset?: PlaygroundPresetName;
  config?: PlaygroundConfig;
  head?: string[];
  htmlAttr?: string;
  files: string;
  height: string;
  fileExplorerHeight: string;
};

export const Playground = async (props: Props) => {
  const {
    preset = "vanilla",
    config,
    files: filesJson,
    head,
    htmlAttr,
    height = "400",
    fileExplorerHeight = "200"
  } = props;
  
  const files = parsePlaygroundFiles(filesJson);

  console.log(files);

  const builder = config
    ? createPlaygroundBuilder(config)
    : createPlaygroundBuilder(preset);

  const srcDoc = await builder.build({ files, head, htmlAttr });

  return (
    <div className="overflow-hidden border border-border">
      <div style={{ height: `${height}px` }}>
        <PlaygroundClient srcDoc={srcDoc} />
      </div>
      <FileExplorer files={files} height={fileExplorerHeight} />
    </div>
  );
};
