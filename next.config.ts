import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages use browser APIs and must not be bundled on the server
  serverExternalPackages: [
    "@cornerstonejs/core",
    "@cornerstonejs/tools",
    "@cornerstonejs/dicom-image-loader",
    "dicom-parser",
    "jpeg-lossless-decoder-js",
  ],

  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Browser build - provide Node.js polyfills as false
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        os: false,
      };

      // Make sure jpeg-lossless-decoder-js is resolved from node_modules
      // and not excluded from the client bundle
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
      };
    }

    return config;
  },
};

export default nextConfig;
