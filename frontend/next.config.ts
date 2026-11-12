import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },

  // Allow Webpack to resolve modules from the monorepo root
  // so that shared/ and backend/ can find clsx, firebase, tailwind-merge, etc.
  webpack: (config) => {
    config.resolve.modules = [
      path.resolve(__dirname, "../node_modules"), // root node_modules
      path.resolve(__dirname, "node_modules"),    // frontend node_modules
      "node_modules",
    ];
    return config;
  },

  // Transpile the shared & backend TS source that lives outside frontend/
  transpilePackages: [],
};

export default nextConfig;
