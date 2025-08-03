/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Temporarily disable PWA to test routing
  // const withPWA = require("next-pwa")({
  //   dest: "public",
  //   register: true,
  //   skipWaiting: true,
  //   disable: process.env.NODE_ENV === "development",
  // });
};

module.exports = nextConfig; 