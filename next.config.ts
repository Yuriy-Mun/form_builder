import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    dynamicIO: true,
  },
  // Отключаем React.StrictMode в development для избежания дублирования запросов
  reactStrictMode: false,
};

export default nextConfig;
