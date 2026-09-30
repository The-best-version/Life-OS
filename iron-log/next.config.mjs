/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is 100% client-side persisted (localStorage). Nothing needs a server
  // runtime, so keep the build lean and deterministic.
  poweredByHeader: false,
};

export default nextConfig;
