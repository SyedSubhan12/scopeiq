/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@novabots/ui", "@novabots/db", "@novabots/types"],
};

module.exports = nextConfig;
