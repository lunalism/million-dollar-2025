/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
        port: "", // 포트가 없으면 빈 문자열
        pathname: "/**", // 모든 경로 허용
      },
    ],
  },
};

module.exports = nextConfig;