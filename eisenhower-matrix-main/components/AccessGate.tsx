'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { ACCESS_STORAGE_KEY, apiFetch } from '@/lib/apiClient';

interface AccessContextValue {
  accessKey: string;
  signOut: () => void;
}

const AccessContext = createContext<AccessContextValue | null>(null);

export const useAccess = () => {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error('useAccess phải được dùng bên trong AccessProvider');
  }
  return ctx;
};

/**
 * Màn hình nhập mã truy cập.
 * Mã được lưu trong trình duyệt và gửi kèm mọi yêu cầu tới máy chủ.
 */
export function AccessProvider({ children }: { children: ReactNode }) {
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra lại mã đã lưu khi mở trang
  useEffect(() => {
    const saved = localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!saved) {
      setChecking(false);
      return;
    }

    apiFetch('/api/session', saved, { method: 'POST' })
      .then(() => setAccessKey(saved))
      .catch(() => localStorage.removeItem(ACCESS_STORAGE_KEY))
      .finally(() => setChecking(false));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(ACCESS_STORAGE_KEY);
    setAccessKey(null);
    setInputValue('');
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setSubmitting(true);
    setError(null);

    try {
      await apiFetch('/api/session', value, { method: 'POST' });
      localStorage.setItem(ACCESS_STORAGE_KEY, value);
      setAccessKey(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng nhập được.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#003B71]">
        Đang kiểm tra mã truy cập...
      </div>
    );
  }

  if (!accessKey) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white border-2 border-[#003B71] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-6 bg-[#F5A81C]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#0072BC]">
              VietinBank Chi nhánh Bắc Nghệ An
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#003B71] mb-1">Ma trận Eisenhower</h1>
          <p className="text-xs text-[#7A8FA6] mb-4">
            Nhập mã truy cập của phòng để xem bảng công việc dùng chung.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Mã truy cập"
              autoFocus
              className="w-full px-3 py-2 border-2 border-[#003B71] text-sm focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
            />
            {error && <p className="text-xs font-semibold text-[#E31837]">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="btn-blue w-full px-4 py-2 font-bold text-sm uppercase disabled:opacity-60"
            >
              {submitting ? 'Đang kiểm tra...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AccessContext.Provider value={{ accessKey, signOut }}>
      {children}
    </AccessContext.Provider>
  );
}
