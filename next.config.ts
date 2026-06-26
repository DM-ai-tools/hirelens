/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "unpdf",
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
