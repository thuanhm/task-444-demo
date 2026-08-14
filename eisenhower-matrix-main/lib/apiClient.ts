'use client';

export const ACCESS_HEADER = 'x-app-key';
export const ACCESS_STORAGE_KEY = 'vtb-eisenhower-access-key';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Gọi API kèm mã truy cập của người dùng */
export async function apiFetch<T>(
  path: string,
  accessKey: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      [ACCESS_HEADER]: accessKey,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Máy chủ không phản hồi đúng.';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // giữ nguyên thông báo mặc định
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
