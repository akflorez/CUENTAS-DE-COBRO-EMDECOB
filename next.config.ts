import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ['@prisma/client', 'jimp', 'jspdf', 'xlsx']
};

export default nextConfig;
