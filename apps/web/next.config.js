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
  },

  // Webpack optimization for faster builds
  webpack: (config, { dev, isServer }) => {
    // Speed up dev builds
    if (dev) {
      config.cache = {
        type: 'filesystem',
        allowCollectingMemory: true,
        buildDependencies: {
          config: [__filename],
        },
        maxAge: 86400000, // 1 day
      };
    }
    return config;
  },

  /** Dev: keep compile/build activity visible near the branded top loader. */
  devIndicators: {
    buildActivityPosition: "top-right",
  },
};

module.exports = nextConfig;
