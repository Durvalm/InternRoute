const isProduction = process.env.NODE_ENV === "production";
const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const connectSources = ["'self'"];
if (rawApiUrl) {
  try {
    connectSources.push(new URL(rawApiUrl).origin);
  } catch (_err) {
    // Ignore malformed URL; runtime fetch calls will still fail loudly.
  }
}
if (!isProduction) {
  connectSources.push("http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*");
}

const cspParts = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src ${Array.from(new Set(connectSources)).join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
];
if (isProduction) {
  cspParts.push("upgrade-insecure-requests");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspParts.join("; ") },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];
if (isProduction) {
  securityHeaders.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
