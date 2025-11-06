import { visit } from "unist-util-visit";
import type { Node } from "unist";
import type { Code } from "mdast";
import { createHash } from "crypto";
import type { VFile } from 'vfile'
import { join } from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

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
  hash: string
  packageName: string
  sourcePath: string
  millPath: string
  outputPath: string
}

/**
 * Generate Mill package file content
 */
const generateMillPackage = (hash: string): string => {
  return `package build.demos.autogen.h${hash}

object \`package\` extends build.WebModule
`
}

const generateModule = (block: ScalaPreviewBlock, workspaceRoot: string): GeneratedModule => {
  const { hash, wrappedCode } = block
  
  // Paths
  const moduleName = `h${hash}`
  const modulePath = join(workspaceRoot, 'demos', 'autogen', moduleName)
  const srcPath = join(modulePath, 'src')
  const millPath = join(modulePath, 'package.mill')
  const scalaPath = join(srcPath, 'Main.scala')
  const outputPath = join(workspaceRoot, 'out', 'demos', 'autogen', moduleName, 'fullLinkJS.dest', 'main.js')

  // Create directories
  if (!existsSync(srcPath)) {
    mkdirSync(srcPath, { recursive: true })
  }

   // Write Mill package file
   writeFileSync(millPath, generateMillPackage(hash))

    // Write Scala source file
  writeFileSync(scalaPath, wrappedCode)

  return {
    hash,
    packageName: `demos.autogen.${moduleName}`,
    sourcePath: scalaPath,
    millPath,
    outputPath,
  }
};

export function previewPlugin() {
  return (tree: Node, file: VFile) => {
    const blocks: Array<{ node: any; block: ScalaPreviewBlock }> = []

    // First pass: collect all Scala preview blocks
    visit(tree, "code", (node: any) => {
      if (isScalaPreview(node)) {
        const meta = parseMeta(node.meta);
        const block = processCodeBlock(node.value, meta);
        console.log(block);
        try {
          generateModule(block, file.cwd)
          blocks.push({ node, block })
        } catch (error) {
          console.error(`Failed to generate module for Scala preview:`, error)
        }
      }
    });

    
  };
}
