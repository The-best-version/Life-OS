/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app is 100% client-side persisted (localStorage). Nothing needs a server
  // runtime, so keep the build lean and deterministic.
  poweredByHeader: false,
  // Lets a verification build write somewhere other than `.next`.
  // A `next build` deletes `.next` wholesale, so running one while a dev server
  // is serving out of the same directory pulls that server's chunks out from
  // under it and it 404s until it is restarted. Set NEXT_DIST_DIR to keep the
  // two apart.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
