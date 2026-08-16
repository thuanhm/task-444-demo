import type { NextConfig } from "next";

const securityHeaders = [
  // Chặn nhúng trang vào iframe từ nơi khác (chống clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Chặn trình duyệt tự đoán loại nội dung khác với Content-Type khai báo
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Không gửi URL đầy đủ (có thể chứa thông tin nội bộ) khi điều hướng sang trang khác
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Tắt các API trình duyệt không dùng đến, giảm bề mặt tấn công
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
