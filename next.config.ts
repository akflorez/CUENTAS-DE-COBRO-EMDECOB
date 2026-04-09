import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg', 'canvas', 'jimp', 'jspdf', 'xlsx']
};

export default nextConfig;
