import type { NextConfig } from "next";

// The store is exported as plain static files (HTML/CSS/JS) and hosted for free
// on Cloudflare Pages. All live data (products, prices, orders) comes from
// Supabase in the browser, protected by Row Level Security.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
