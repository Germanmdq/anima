import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir que la API route use 'fs' del server-side
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
