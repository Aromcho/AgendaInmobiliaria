/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build sin downtime: se compila en otra carpeta (NEXT_DIST_DIR=.next-new) mientras prod sigue sirviendo .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: 'standalone',
};

export default nextConfig;
