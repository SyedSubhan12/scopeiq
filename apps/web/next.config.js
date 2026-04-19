const path = require('path')
const fs = require('fs')

// Workaround for Next.js 14.1.0 + Turbopack race condition:
// handleEntries() calls writeFileAtomic into .next/static/development/ before
// the mkdir for that directory has executed in setup-dev-bundler.js. Pre-creating
// the directory at config-load time (which always precedes Turbopack startup)
// eliminates the ENOENT. Fixed upstream in Next.js 14.2+.
fs.mkdirSync(path.join(__dirname, '.next', 'static', 'development'), { recursive: true })

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only transpile packages that are actually imported in browser code.
  // @novabots/db uses the `pg` Node.js driver — it must NEVER be bundled
  // for the browser. The web app talks to the API via HTTP only.
  transpilePackages: ["@novabots/ui", "@novabots/types"],

  // Optimize compilation speed for development
  experimental: {
    // Speed up module resolution for large icon libraries
    optimizePackageImports: ["lucide-react", "date-fns", "@radix-ui/react-slot"],
    // Reduce memory usage during compilation
    serverComponentsExternalPackages: ["@novabots/db"],
  },

  // Webpack optimization for faster builds
  webpack: (config, { dev, isServer }) => {
    // Speed up dev builds and reduce memory usage
    if (dev) {
      // Disable caching to avoid memory issues on low-RAM systems
      config.cache = false;
      // Reduce parallelism to save memory
      config.parallelism = 1;
    }
    return config;
  },

  /** Dev: keep compile/build activity visible near the branded top loader. */
  devIndicators: {
    buildActivityPosition: "top-right",
  },
};

module.exports = nextConfig;
