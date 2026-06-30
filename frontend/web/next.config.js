/** @type {import('next').NextConfig} */

const backendApiUrl = (
  process.env.BACKEND_API_URL || ""
).replace(/\/$/, "");

const imageBaseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
  "http://localhost:5000/uploads";

const LOCAL_IMAGE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
]);

let remotePattern;
let imageHostIsLocal = false;

try {
  const parsedUrl = new URL(imageBaseUrl);

  imageHostIsLocal = LOCAL_IMAGE_HOSTS.has(parsedUrl.hostname);

  remotePattern = {
    protocol: parsedUrl.protocol.replace(":", ""),
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    pathname: `${parsedUrl.pathname.replace(/\/$/, "")}/**`,
  };
} catch {
  imageHostIsLocal = true;

  remotePattern = {
    protocol: "http",
    hostname: "localhost",
    port: "5000",
    pathname: "/uploads/**",
  };
}

const allowLocalImageOptimization =
  process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === "true" ||
  imageHostIsLocal;

const nextConfig = {
  experimental: {
    // Keep builds stable on Windows and CI machines.
    cpus: 2,
  },

  async rewrites() {
    if (!backendApiUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [remotePattern],

    // Enabled automatically only for local development images.
    dangerouslyAllowLocalIP: allowLocalImageOptimization,
  },
};

module.exports = nextConfig;