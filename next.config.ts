/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pdf-parse",
    "puppeteer",
    "tesseract.js",
    "bullmq",
    "ioredis",
    "@prisma/client",
    "bcryptjs",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
