import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "",
  project: process.env.SENTRY_PROJECT ?? "revlooper-frontend",

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client files for better stack trace resolution
  widenClientFileUpload: true,

  // Proxy Sentry requests through /monitoring to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress build output outside CI
  silent: !process.env.CI,
});
