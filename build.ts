import path from 'path';

async function main() {
  const result =await Bun.build({
    entrypoints: ['./out/examples/autogen/react/example1/fullLinkJS.dest/main.js'],
    // outdir: './examples-build',
    target: 'browser',
    format: 'esm',
    minify: true, 
  });

  for (const res of result.outputs) {
    // Can be written manually, but you should use `outdir` in this case.
    Bun.write(path.join("examples-build", res.path), res);
  }
}

main().catch(console.error);