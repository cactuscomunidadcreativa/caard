import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de imagen - compatible con Cloudflare
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
    ],
    // Formatos optimizados
    formats: ["image/avif", "image/webp"],
  },

  // Headers de seguridad adicionales a nivel de Next.js
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        // Prevenir que uploads de SVG ejecuten scripts
        source: "/uploads/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "script-src 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // Configuración para Cloudflare (si se despliega ahí)
  // Descomenta si usas Cloudflare Pages:
  // output: "standalone",

  // Logging reducido en producción
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // Variables de entorno públicas expuestas al cliente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.APP_URL || "http://localhost:3000",
  },

  // Configuración experimental
  experimental: {
    // Optimiza server actions
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
