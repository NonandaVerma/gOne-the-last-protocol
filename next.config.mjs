/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate canvas mount cycles during dev
  async headers() {
    // Baseline hardening only — no CSP here. The game loads local video/audio,
    // WebGL canvases, and Google Fonts; a CSP written without live testing
    // against all of that risks silently breaking the cinematics or canvas
    // rendering, which the engineering brief explicitly rules out.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Avoid node built-ins in client bundle if any
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
