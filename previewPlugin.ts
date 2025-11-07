import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { Code } from "mdast";
import { createHash } from "crypto";
import type { VFile } from "vfile";
import { join } from "path";
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

export const basicTemplate = (ctx: TemplateContext): string => {
  return `package demos.autogen.h${ctx.hash}

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
}

export const applyTemplate = (
  userCode: string,
  hash: string,
  templateType: ScalaTemplateType = "basic"
) => {
  const template = getTemplate(templateType);
  return template({ hash, userCode });
};

const processCodeBlock = (
  code: string,
  meta?: ScalaPreviewMeta
): ScalaPreviewBlock => {
  const hash = generateHash(code);
  const wrappedCode = applyTemplate(code, hash, "basic");

  return {
    hash,
    sourceCode: code,
    wrappedCode,
  };
};

interface GeneratedModule {
  hash: string;
  packageName: string;
  sourcePath: string;
  millPath: string;
  outputPath: string;
}

interface GeneratedModule {
  hash: string;
  packageName: string;
  sourcePath: string;
  millPath: string;
  outputPath: string;
}

/**
 * Generate Mill package file content
 */
const generateMillPackage = (hash: string): string => {
  return `package build.demos.autogen.h${hash}

object \`package\` extends build.WebModule
`;
};

const generateModule = (
  block: ScalaPreviewBlock,
  workspaceRoot: string
): GeneratedModule => {
  const { hash, wrappedCode } = block;

  // Paths
  const moduleName = `h${hash}`;
  const modulePath = join(workspaceRoot, "demos", "autogen", moduleName);
  const srcPath = join(modulePath, "src");
  const millPath = join(modulePath, "package.mill");
  const scalaPath = join(srcPath, "Main.scala");
  const outputPath = join(
    workspaceRoot,
    "out",
    "demos",
    "autogen",
    moduleName,
    "fullLinkJS.dest",
    "main.js"
  );

  // Create directories
  if (!existsSync(srcPath)) {
    mkdirSync(srcPath, { recursive: true });
  }

  // Write Mill package file
  writeFileSync(millPath, generateMillPackage(hash));

  // Write Scala source file
  writeFileSync(scalaPath, wrappedCode);

  return {
    hash,
    packageName: `demos.autogen.${moduleName}`,
    sourcePath: scalaPath,
    millPath,
    outputPath,
  };
};

export const getRelativeOutputPath = (hash: string): string => {
  return `out/demos/autogen/h${hash}/fullLinkJS.dest/main.js`;
};

export const getRelativeSourcePath = (hash: string): string => {
  return `demos/autogen/h${hash}/src/Main.scala`;
};

const appendProp = (node: any, propName: string, propValue: unknown): void => {
  node.attributes.push({
    type: 'mdxJsxAttribute',
    name: propName,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: JSON.stringify(propValue),
      data: {
        estree: {
          type: 'Program',
          body: [
            {
              type: 'ExpressionStatement',
              expression: valueToEstree(propValue),
            },
          ],
          sourceType: 'module',
        },
      },
    },
  });
};


const transformToPlayground = async (
  node: any,
  block: ScalaPreviewBlock,
  vfile: VFile
) => {
  const { hash, sourceCode } = block;

  // Get paths
  const jsPath = getRelativeOutputPath(hash);
  const scalaPath = getRelativeSourcePath(hash);

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

    // First pass: collect all Scala preview blocks
    visit(tree, "code", (node: any) => {
      if (isScalaPreview(node)) {
        const meta = parseMeta(node.meta);
        const block = processCodeBlock(node.value, meta);
        (block);
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
