import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'canvas', 'jimp', 'jspdf', 'xlsx']
};

export default nextConfig;
