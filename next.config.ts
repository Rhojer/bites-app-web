import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/bites-app-web',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/bites-app-web',
  },
};

export default nextConfig;
