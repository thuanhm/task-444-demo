import { neon } from '@neondatabase/serverless';

/**
 * Kết nối Neon (PostgreSQL) theo kiểu serverless.
 * Khởi tạo trễ (lazy) để lệnh `next build` không đòi biến môi trường.
 */
let client: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Neon).');
    }
    client = neon(url);
  }
  return client;
}

/** Mã không gian làm việc - cho phép tách dữ liệu theo đơn vị nếu cần */
export const WORKSPACE = process.env.WORKSPACE_ID ?? 'bac-nghe-an';
