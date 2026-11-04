import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    // The picker used to live at /notes.
    return [{ source: "/notes", destination: "/", permanent: true }];
  },
};

export default nextConfig;
