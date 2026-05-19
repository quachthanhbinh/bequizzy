/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Pages (revlooper.com)
  output: "export",
  // Trailing slashes for consistent Cloudflare Pages routing
  trailingSlash: true,
};

export default nextConfig;
