/** @type {import('next').NextConfig} */
const imageBaseUrl =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "http://localhost:5000/uploads";

const LOCAL_IMAGE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

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
  process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === "true" || imageHostIsLocal;

const nextConfig = {
  experimental: {
    // Keep builds stable on Windows and high-core CI machines.
    cpus: 2,
  },
  images: {
    remotePatterns: [remotePattern],
    // Next.js 16 blocks localhost/private-IP image optimization by default.
    // This is enabled automatically only when the configured image host is local.
    dangerouslyAllowLocalIP: allowLocalImageOptimization,
  },
};

module.exports = nextConfig;
