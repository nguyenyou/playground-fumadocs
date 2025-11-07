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
  number: number;
  userCode: string;
}

export const getTemplate = (templateType: ScalaTemplateType) => {
  switch (templateType) {
    case "basic":
      return basicTemplate;
  }
};

export const basicTemplate = (ctx: TemplateContext & { docName: string }): string => {
  return `package examples.autogen.${ctx.docName}.example${ctx.number}

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
  number: number;
  sourceCode: string;
  wrappedCode: string;
  docName: string;
}

export const applyTemplate = (
  userCode: string,
  number: number,
  docName: string,
  templateType: ScalaTemplateType = "basic"
) => {
  const template = getTemplate(templateType);
  return template({ number, userCode, docName });
};

const processCodeBlock = (
  code: string,
  docName: string,
  number: number,
  meta?: ScalaPreviewMeta
): ScalaPreviewBlock => {
  const hash = generateHash(code);
  const wrappedCode = applyTemplate(code, number, docName, "basic");

  return {
    hash,
    number,
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
 * Generate Mill package file content for examples module
 */
const generateExamplesMillPackage = (): string => {
  return `package build.examples

object \`package\` extends build.WebModule
`;
};

/**
 * Generate Mill package file content for autogen module
 */
const generateAutogenMillPackage = (): string => {
  return `package build.examples.autogen

object \`package\` extends build.WebModule
`;
};

/**
 * Generate Mill package file content for parent module (doc file)
 */
const generateParentMillPackage = (docName: string): string => {
  return `package build.examples.autogen.${docName}

object \`package\` extends build.WebModule
`;
};

/**
 * Generate Mill package file content for child module (example)
 */
const generateChildMillPackage = (docName: string, number: number): string => {
  return `package build.examples.autogen.${docName}.example${number}

object \`package\` extends build.WebModule
`;
};

/**
 * Extract doc name from file path
 * - If path has a subfolder under docs/ (e.g., "content/docs/react/sjs.mdx"), use subfolder name ("react")
 * - Otherwise (e.g., "content/docs/sjs.mdx"), use filename ("sjs")
 */
const getDocNameFromPath = (filePath: string): string => {
  // Normalize the path and split by path separator
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  
  // Find the index of "docs" folder
  const docsIndex = parts.findIndex(part => part === 'docs');
  
  if (docsIndex !== -1 && docsIndex < parts.length - 1) {
    // Check if there's a subfolder after "docs"
    // e.g., ["content", "docs", "react", "sjs.mdx"] -> docsIndex=1, next part is "react"
    const nextPart = parts[docsIndex + 1];
    const filename = parts[parts.length - 1];
    
    // If next part is not a filename (doesn't have extension), it's a subfolder
    if (nextPart && !extname(nextPart) && nextPart !== filename) {
      return nextPart;
    }
  }
  
  // Fallback to filename without extension
  const filename = basename(filePath);
  const nameWithoutExt = extname(filename) ? filename.replace(extname(filename), '') : filename;
  return nameWithoutExt || 'default';
};

/**
 * Ensure examples and autogen directories exist with their package.mill files
 */
const ensureExamplesStructure = (workspaceRoot: string): void => {
  // Ensure examples directory exists
  const examplesPath = join(workspaceRoot, "examples");
  const examplesMillPath = join(examplesPath, "package.mill");
  
  if (!existsSync(examplesPath)) {
    mkdirSync(examplesPath, { recursive: true });
  }
  
  if (!existsSync(examplesMillPath)) {
    writeFileSync(examplesMillPath, generateExamplesMillPackage());
  }

  // Ensure autogen directory exists
  const autogenPath = join(workspaceRoot, "examples", "autogen");
  const autogenMillPath = join(autogenPath, "package.mill");
  
  if (!existsSync(autogenPath)) {
    mkdirSync(autogenPath, { recursive: true });
  }
  
  if (!existsSync(autogenMillPath)) {
    writeFileSync(autogenMillPath, generateAutogenMillPackage());
  }
};

/**
 * Ensure parent module exists (create if needed)
 */
const ensureParentModule = (
  docName: string,
  workspaceRoot: string
): void => {
  // Ensure examples and autogen structure exists first
  ensureExamplesStructure(workspaceRoot);

  const parentModulePath = join(workspaceRoot, "examples", "autogen", docName);
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
  const { hash, number, wrappedCode, docName } = block;

  // Ensure parent module exists
  ensureParentModule(docName, workspaceRoot);

  // Paths for child module
  const moduleName = `example${number}`;
  const modulePath = join(workspaceRoot, "examples", "autogen", docName, moduleName);
  const srcPath = join(modulePath, "src");
  const millPath = join(modulePath, "package.mill");
  const scalaPath = join(srcPath, "Main.scala");
  const outputPath = join(
    workspaceRoot,
    "out",
    "examples",
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
  writeFileSync(millPath, generateChildMillPackage(docName, number));

  // Write Scala source file
  writeFileSync(scalaPath, wrappedCode);

  return {
    hash,
    docName,
    packageName: `examples.autogen.${docName}.${moduleName}`,
    sourcePath: scalaPath,
    millPath,
    outputPath,
  };
};

export const getRelativeOutputPath = (docName: string, number: number): string => {
  return `out/examples/autogen/${docName}/example${number}/fullLinkJS.dest/main.js`;
};

export const getRelativeSourcePath = (docName: string, number: number): string => {
  return `examples/autogen/${docName}/example${number}/src/Main.scala`;
};

const transformToPlayground = (
  node: any,
  block: ScalaPreviewBlock,
  vfile: VFile,
  exampleNumber: number
) => {
  const { hash, number, sourceCode, docName } = block;

  // Get paths
  const jsPath = getRelativeOutputPath(docName, number);
  const scalaPath = getRelativeSourcePath(docName, number);

  let code = ""
  const filePath = join(vfile.cwd, jsPath);
  
  if (existsSync(filePath)) {
    code = readFileSync(filePath, 'utf8');
  } else {
    const errorMessage = `File not found: ${jsPath}`;
    console.error(errorMessage);
    // Inject JavaScript code that appends error message to document.body
    code = `
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'padding: 1rem; margin: 1rem 0; background-color: #fee; border: 1px solid #fcc; border-radius: 4px; color: #c33;';
      errorDiv.textContent = '⚠️ Error: ${errorMessage}';
      document.body.appendChild(errorDiv);
    `;
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
    let exampleCounter = 0;
    visit(tree, "code", (node: any) => {
      if (isScalaPreview(node)) {
        exampleCounter++;
        const meta = parseMeta(node.meta);
        const block = processCodeBlock(node.value, docName, exampleCounter, meta);
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
    for (let i = 0; i < blocks.length; i++) {
      const { node, block } = blocks[i];
      try {
        transformToPlayground(node, block, file, i + 1);
      } catch (error) {
        console.error(`Failed to transform to Playground:`, error);
      }
    }
  };
}
