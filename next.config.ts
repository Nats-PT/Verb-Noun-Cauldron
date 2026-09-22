import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้มือถือในวง Wi-Fi เดียวกันเปิด dev server ผ่าน IP ของคอมได้ (มีผลเฉพาะตอน npm run dev)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
