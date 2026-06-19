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
        destination: "/live",
        permanent: false,
      },
      {
        source: "/experience/live",
        destination: "/live",
        permanent: false,
      },
      {
        source: "/experience/live/ig",
        destination: "/live",
        permanent: true,
      },
      {
        source: "/experience/live/ig/:path*",
        destination: "/live",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/email-gate/attendee",
        permanent: false,
      },
      {
        source: "/create-account",
        destination: "/email-gate/attendee/create-account",
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
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
