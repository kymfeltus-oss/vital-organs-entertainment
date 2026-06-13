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
      {
        source: "/email-gate/login",
        destination: "/email-gate/attendee",
        permanent: false,
      },
      {
        source: "/email-gate/signup",
        destination: "/email-gate/attendee",
        permanent: false,
      },
      {
        source: "/email-gate/guest",
        destination: "/email-gate/attendee",
        permanent: false,
      },
      {
        source: "/prayer",
        destination: "/experience/prayer",
        permanent: false,
      },
      {
        source: "/giving",
        destination: "/experience/giving",
        permanent: false,
      },
      {
        source: "/music",
        destination: "/experience/music",
        permanent: false,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
