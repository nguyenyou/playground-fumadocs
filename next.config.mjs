import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: process.env.PAGES_BASE_PATH,
  experimental: {
    reactCompiler: true,
  }
};

export default withMDX(config);
