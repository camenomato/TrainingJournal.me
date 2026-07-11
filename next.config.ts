import type { NextConfig } from "next";

// GITHUB_PAGES is set only by .github/workflows/pages.yml, which publishes
// the example dashboard to GitHub Pages. Local dev and Vercel deploys are
// untouched by it.
const onGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = onGitHubPages
  ? {
      output: "export",
      basePath: process.env.PAGES_BASE_PATH ?? "",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
