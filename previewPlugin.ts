import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { Code } from "mdast";
import { createHash } from "crypto";
import type { VFile } from "vfile";
import { join, basename, extname } from "path";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { valueToEstree } from "estree-util-value-to-estree";

export type ScalaTemplateType = "basic";

export interface ScalaPreviewMeta {}

/**
 * Check if a code node is a Scala preview block
 */
const isScalaPreview = (node: Code): boolean => {
  return (node.lang === "scala" && node.meta?.includes("preview")) || false;
};

const parseMeta = (meta: any) => {
  if (!meta) return {};

  const result: ScalaPreviewMeta = {};
  const parts = meta.split(/\s+/);

  for (const part of parts) {
    if (part === "preview") {
      continue;
    }
  }

  return result;
};

/**
 * Generate a hash from source code
 */
export const generateHash = (code: string): string => {
  return createHash("sha256").update(code).digest("hex").substring(0, 12);
};

interface TemplateContext {
  hash: string;
  userCode: string;
}

export const getTemplate = (templateType: ScalaTemplateType) => {
  switch (templateType) {
    case "basic":
      return basicTemplate;
  }
};

export const basicTemplate = (ctx: TemplateContext & { docName: string }): string => {
  return `package demos.autogen.${ctx.docName}.h${ctx.hash}

import org.scalajs.dom
import com.raquo.laminar.api.L.*
@main def app = {
  val container = dom.document.querySelector("#root")
  render(container, {
    ${ctx.userCode.split("\n").join("\n    ")}
  })
}
`;
};

interface ScalaPreviewBlock {
  hash: string;
  sourceCode: string;
  wrappedCode: string;
  docName: string;
}

export const applyTemplate = (
  userCode: string,
  hash: string,
  docName: string,
  templateType: ScalaTemplateType = "basic"
) => {
  const template = getTemplate(templateType);
  return template({ hash, userCode, docName });
};

const processCodeBlock = (
  code: string,
  docName: string,
  meta?: ScalaPreviewMeta
): ScalaPreviewBlock => {
  const hash = generateHash(code);
  const wrappedCode = applyTemplate(code, hash, docName, "basic");

  return {
    hash,
    sourceCode: code,
    wrappedCode,
    docName,
  };
};

interface GeneratedModule {
  hash: string;
  docName: string;
  packageName: string;
  sourcePath: string;
  millPath: string;
  outputPath: string;
}

/**
 * Generate Mill package file content for parent module (doc file)
 */
const generateParentMillPackage = (docName: string): string => {
  return `package build.demos.autogen.${docName}

object \`package\` extends build.WebModule
`;
};

/**
 * Generate Mill package file content for child module (example)
 */
const generateChildMillPackage = (docName: string, hash: string): string => {
  return `package build.demos.autogen.${docName}.h${hash}

object \`package\` extends build.WebModule
`;
};

/**
 * Extract doc name from file path
 * e.g., "content/docs/sjs.mdx" -> "sjs"
 */
const getDocNameFromPath = (filePath: string): string => {
  const filename = basename(filePath);
  const nameWithoutExt = extname(filename) ? filename.replace(extname(filename), '') : filename;
  return nameWithoutExt || 'default';
};

/**
 * Ensure parent module exists (create if needed)
 */
const ensureParentModule = (
  docName: string,
  workspaceRoot: string
): void => {
  const parentModulePath = join(workspaceRoot, "demos", "autogen", docName);
  const parentMillPath = join(parentModulePath, "package.mill");

  // Create parent directory if it doesn't exist
  if (!existsSync(parentModulePath)) {
    mkdirSync(parentModulePath, { recursive: true });
  }

  // Create parent package.mill if it doesn't exist
  if (!existsSync(parentMillPath)) {
    writeFileSync(parentMillPath, generateParentMillPackage(docName));
  }
};

const generateModule = (
  block: ScalaPreviewBlock,
  workspaceRoot: string
): GeneratedModule => {
  const { hash, wrappedCode, docName } = block;

  // Ensure parent module exists
  ensureParentModule(docName, workspaceRoot);

  // Paths for child module
  const moduleName = `h${hash}`;
  const modulePath = join(workspaceRoot, "demos", "autogen", docName, moduleName);
  const srcPath = join(modulePath, "src");
  const millPath = join(modulePath, "package.mill");
  const scalaPath = join(srcPath, "Main.scala");
  const outputPath = join(
    workspaceRoot,
    "out",
    "demos",
    "autogen",
    docName,
    moduleName,
    "fullLinkJS.dest",
    "main.js"
  );

  // Create directories
  if (!existsSync(srcPath)) {
    mkdirSync(srcPath, { recursive: true });
  }

  // Write Mill package file for child module
  writeFileSync(millPath, generateChildMillPackage(docName, hash));

  // Write Scala source file
  writeFileSync(scalaPath, wrappedCode);

  return {
    hash,
    docName,
    packageName: `demos.autogen.${docName}.${moduleName}`,
    sourcePath: scalaPath,
    millPath,
    outputPath,
  };
};

export const getRelativeOutputPath = (docName: string, hash: string): string => {
  return `out/demos/autogen/${docName}/h${hash}/fullLinkJS.dest/main.js`;
};

export const getRelativeSourcePath = (docName: string, hash: string): string => {
  return `demos/autogen/${docName}/h${hash}/src/Main.scala`;
};

const transformToPlayground = async (
  node: any,
  block: ScalaPreviewBlock,
  vfile: VFile
) => {
  const { hash, sourceCode, docName } = block;

  // Get paths
  const jsPath = getRelativeOutputPath(docName, hash);
  const scalaPath = getRelativeSourcePath(docName, hash);

  let code = ""
  const filePath = join(vfile.cwd, jsPath);
  if (existsSync(filePath)) {
    code = readFileSync(filePath, 'utf8');
  } else {
    console.error(`File not found: ${jsPath}`);
  }

  const files: Record<string, any> = {
    "/main.js": {
      code: code,
      hidden: false,
      active: false,
      lang: "js",
    },
    "/Main.scala": {
      code: sourceCode,
      hidden: false,
      active: true,
      lang: "scala",
    },
  };

  // Replace the code node with a Playground JSX element
  node.type = "mdxJsxFlowElement";
  node.name = "Playground";

  node.attributes = node.attributes || [];

  node.attributes.push({
    type: "mdxJsxAttribute",
    name: "files",
    value: JSON.stringify(files),
  });

  node.attributes.push({
    type: "mdxJsxAttribute",
    name: "preset",
    value: 'vanilla',
  });

  // appendProp(node, 'files', files)

  // appendProp(node, 'preset', 'vanilla')

  node.children = [];

  // Store metadata
  delete node.lang;
  delete node.meta;
  delete node.value;
};

/*

Turn

```scala preview
div("Hello, world!")
```

Into

<Playground preset="vanilla" files={{
  "/Main.scala": {
    code: "div(\"Hello, world!\")",
    hidden: false,
    active: true,
    lang: "scala",
  },
}}>

</Playground>

*/
export function previewPlugin() {
  return (tree: Node, file: VFile) => {
    const blocks: Array<{ node: any; block: ScalaPreviewBlock }> = [];
    
    // Extract doc name from file path
    const docName = getDocNameFromPath(file.path || file.history?.[0] || 'default');

    // First pass: collect all Scala preview blocks
    visit(tree, "code", (node: any) => {
      if (isScalaPreview(node)) {
        const meta = parseMeta(node.meta);
        const block = processCodeBlock(node.value, docName, meta);
        try {
          generateModule(block, file.cwd);
          blocks.push({ node, block });
        } catch (error) {
          console.error(`Failed to generate module for Scala preview:`, error);
        }
      }
    });

    // Store blocks in file data for use by compilation script
    if (!file.data) {
      file.data = {};
    }
    file.data.scalaPreviewBlocks = blocks.map((b) => b.block);

    // Second pass: transform nodes to Playground components
    for (const { node, block } of blocks) {
      try {
        transformToPlayground(node, block, file)
      } catch (error) {
        console.error(`Failed to transform to Playground:`, error);
      }
    }
  };
}
