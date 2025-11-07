import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { VFile } from 'vfile'
import { basename, join } from 'path';
import { existsSync, readFileSync } from 'fs';

interface ProcessMetaResult {
  fileName: string | null;
  hidden: boolean;
  active: boolean;
  ref: string | null;
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
    files?: any;
  }>;
}

function processMeta(meta?: string): ProcessMetaResult {
  const result: ProcessMetaResult = {
    fileName: null,
    hidden: false,
    active: false,
    ref: null
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
    if (prop.startsWith("ref=")) {
      result.ref = prop.split("=")[1];
      result.fileName = basename(result.ref);
    }

    if (prop in result && prop !== "fileName") {
      (result as any)[prop] = true;
    }
  }
  return result;
}

function prepareFilesProp(node: PlaygroundNode, vfile: VFile): FilesObject {
  const { children } = node;
  const files: FilesObject = {};

  // Safety check: ensure children exists and is an array
  if (!children || !Array.isArray(children)) {
    return files;
  }

  for (let i = 0; i < children.length; i++) {
    const n = children[i];
    const { meta, lang, value } = n;
    const result = processMeta(meta);
    let code = value.trim()

    // Skip if no fileName is found
    if (!result.fileName) continue;

    if(result.ref) {
      const filePath = join(vfile.cwd, result.ref);
      if (existsSync(filePath)) {
        code = readFileSync(filePath, 'utf8');
      } else {
        console.error(`File not found: ${result.ref}`);
      }
    }

    const file: FileData = {
      code: code,
      hidden: result.hidden,
      active: result.active,
      lang,
    };
    files[`/${result.fileName}`] = file;
  }
  return files;
}

function processPlaygroundNode(playgroundNode: PlaygroundNode, file: VFile) {
  console.log('processPlaygroundNode');
  playgroundNode.attributes = playgroundNode.attributes || [];

  // Skip if files attribute already exists (e.g., from previewPlugin)
  const hasFilesAttr = playgroundNode.attributes.some(attr => attr.name === 'files');
  if (hasFilesAttr) {
    console.log(`=====> Files attribute already exists for Playground node`);
    return;
  }

  const files = prepareFilesProp(playgroundNode, file);

  /*
  <Playground>
  
  ```css styles.css
  ```

  ```html index.html
  ```

  ```js main.js
  ```
  
  </Playground>

  <Playground files={{
    "index.html": {
      code: "",
      lang: "html",
      hidden: false,
      active: false,
    },
    "styles.css": {
      code: "",
      lang: "css",
      hidden: false,
      active: false,
    },
    "main.js": {
      code: "",
      lang: "js",
      hidden: false,
      active: false,
    },
  }}>
  
  ```css styles.css
  ```

  ```html index.html
  ```

  ```js main.js
  ```
  
  </Playground>

  */
  playgroundNode.attributes.push({
    type: "mdxJsxAttribute",
    name: "files",
    value: JSON.stringify(files),
  });
}

export function playgroundRemarkPlugin() {
  return (tree: Node, file: VFile) => {
    visit(tree, (node: Node) => {
      const playgroundNode = node as PlaygroundNode;
      if (playgroundNode.name === "Playground") {
        processPlaygroundNode(playgroundNode, file);
      }
    });
  };
}
