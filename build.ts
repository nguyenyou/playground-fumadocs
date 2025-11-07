import path from 'path';
import { readdirSync, existsSync, statSync, mkdirSync } from 'fs';

interface ExampleEntry {
  entrypoint: string;
  outputPath: string;
  docName: string;
  exampleName: string;
}

/**
 * Recursively find all main.js files in the out/examples/autogen directory
 */
function findExamples(outDir: string, baseDir: string = ''): ExampleEntry[] {
  const examples: ExampleEntry[] = [];
  const fullPath = path.join(outDir, baseDir);

  if (!existsSync(fullPath)) {
    return examples;
  }

  const entries = readdirSync(fullPath);

  for (const entry of entries) {
    const entryPath = path.join(fullPath, entry);
    const relativePath = baseDir ? path.join(baseDir, entry) : entry;
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      // Check if this directory contains main.js (it's an example directory)
      const mainJsPath = path.join(entryPath, 'fullLinkJS.dest', 'main.js');
      if (existsSync(mainJsPath)) {
        // Extract docName and exampleName from path
        // relativePath format: {docName}/example{number}
        const parts = relativePath.split(path.sep);
        const docName = parts[0];
        const exampleName = parts[1]; // e.g., "example1"

        examples.push({
          entrypoint: mainJsPath,
          outputPath: path.join('examples-build', docName, `${exampleName}.js`),
          docName,
          exampleName,
        });
      } else {
        // Continue searching in subdirectories (docName directories)
        examples.push(...findExamples(outDir, relativePath));
      }
    }
  }

  return examples;
}

async function main() {
  const outDir = './out/examples/autogen';
  
  if (!existsSync(outDir)) {
    console.log('No examples found. Run mill build first.');
    return;
  }

  // Find all examples
  const examples = findExamples(outDir);

  if (examples.length === 0) {
    console.log('No examples found to build.');
    return;
  }

  console.log(`Found ${examples.length} example(s) to build:`);
  examples.forEach(ex => {
    console.log(`  - ${ex.entrypoint} -> ${ex.outputPath}`);
  });

  // Build each example
  for (const example of examples) {
    try {
      const result = await Bun.build({
        entrypoints: [example.entrypoint],
        target: 'browser',
        format: 'esm',
        minify: true,
      });

      if (!result.success) {
        console.error(`Failed to build ${example.entrypoint}:`, result.logs);
        continue;
      }

      // Ensure output directory exists
      const outputDir = path.dirname(example.outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Write bundled output
      for (const output of result.outputs) {
        await Bun.write(example.outputPath, output);
        console.log(`✓ Built: ${example.outputPath}`);
      }
    } catch (error) {
      console.error(`Error building ${example.entrypoint}:`, error);
    }
  }

  console.log('\nBuild complete!');
}

main().catch(console.error);
