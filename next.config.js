/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nnqdfayvqsyymanynvbe.supabase.co",
        pathname: "/storage/v1/object/public/pixel-content/**",
      },
    ],
  },
};

export default nextConfig;