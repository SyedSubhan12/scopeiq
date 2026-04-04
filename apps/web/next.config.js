/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only transpile packages that are actually imported in browser code.
  // @novabots/db uses the `pg` Node.js driver — it must NEVER be bundled
  // for the browser. The web app talks to the API via HTTP only.
  transpilePackages: ["@novabots/ui", "@novabots/types"],
};

module.exports = nextConfig;
