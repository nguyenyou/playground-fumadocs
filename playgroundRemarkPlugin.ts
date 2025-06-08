import { visit } from "unist-util-visit";
import type { Node } from "unist";

interface ProcessMetaResult {
  fileName: string | null;
  hidden: boolean;
  active: boolean;
}

export interface FileData {
  code: string;
  hidden: boolean;
  active: boolean;
  lang: string;
}

export interface FilesObject {
  [path: string]: FileData;
}

interface CodeNode {
  meta?: string;
  lang: string;
  value: string;
}

interface PlaygroundNode extends Node {
  name: string;
  children: CodeNode[];
  attributes?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
}

function processMeta(meta?: string): ProcessMetaResult {
  const result: ProcessMetaResult = {
    fileName: null,
    hidden: false,
    active: false,
  };
  
  if (!meta) return result;
  
  const arr = meta.split(/[ ,]+/);
  for (let i = 0; i < arr.length; i++) {
    const prop = arr[i];
    if (
      prop.endsWith(".js") ||
      prop.endsWith(".css") ||
      prop.endsWith(".html")
    ) {
      result.fileName = prop;
    }
    if (prop in result && prop !== 'fileName') {
      (result as any)[prop] = true;
    }
  }
  return result;
}

function prepareFilesProp(node: PlaygroundNode): FilesObject {
  const { children } = node;
  const files: FilesObject = {};

  for (let i = 0; i < children.length; i++) {
    const n = children[i];
    const { meta, lang, value } = n;
    const result = processMeta(meta);
    
    // Skip if no fileName is found
    if (!result.fileName) continue;
    
    const file: FileData = {
      code: value.trim(),
      hidden: result.hidden,
      active: result.active,
      lang,
    };
    files[`/${result.fileName}`] = file;
  }
  return files;
}

export function playgroundRemarkPlugin() {
  return (tree: Node) => {
    visit(tree, (node: Node) => {
      const playgroundNode = node as PlaygroundNode;
      if (playgroundNode.name === "Playground") {
        playgroundNode.attributes = playgroundNode.attributes || [];
        const files = prepareFilesProp(playgroundNode);
        playgroundNode.attributes.push({
          type: "mdxJsxAttribute",
          name: "files",
          value: JSON.stringify(files),
        });
      }
    });
  };
}
