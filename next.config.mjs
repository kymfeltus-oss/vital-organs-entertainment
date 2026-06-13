/** @type {import('next').NextConfig} */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig = {
  ...(isCapacitorBuild ? { output: "export" } : {}),
  typedRoutes: false,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/live",
        destination: "/experience/live",
        permanent: false,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
