/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.epic.com https://epic.com;",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Preserve Next's defaults; only enable async WASM explicitly
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
      // Do not force `layers` as it can break Next's CSS pipeline
    };

    // Allow loading of .wasm files
    // Some Next build phases may provide partial webpack config objects.
    const moduleConfig = config.module || {};
    const existingRules = Array.isArray(moduleConfig.rules) ? moduleConfig.rules : [];
    existingRules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });
    config.module = {
      ...moduleConfig,
      rules: existingRules,
    };

    return config;
  },
}

export default nextConfig