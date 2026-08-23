import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // E2E builds/serves from its own dir so a running `next dev` (which owns
  // .next) can never corrupt the production build under test.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
};

export default nextConfig;
