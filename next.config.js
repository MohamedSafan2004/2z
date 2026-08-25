/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },

          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.clarity.ms https://*.clarity.ms; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://www.facebook.com https://c.clarity.ms; " +
              "connect-src 'self' https://api.anthropic.com https://*.prisma.io https://*.upstash.io https://connect.facebook.net https://www.facebook.com https://www.clarity.ms https://*.clarity.ms https://*.run.app https://*.on.aws;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;