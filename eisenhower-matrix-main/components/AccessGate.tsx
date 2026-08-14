'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Form, Input, Button, Card, Typography, Spin, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';
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
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const handleSubmit = async (values: { accessKey: string }) => {
    const value = values.accessKey.trim();
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
      <div className="min-h-screen flex items-center justify-center">
        <Spin tip="Đang kiểm tra mã truy cập..." size="large">
          <div style={{ padding: 60 }} />
        </Spin>
      </div>
    );
  }

  if (!accessKey) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Card
          style={{ maxWidth: 380, width: '100%', border: '2px solid #00203F', borderRadius: 2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-2 h-6 bg-[#D8A13B]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#004A8F]">
              VietinBank Chi nhánh Bắc Nghệ An
            </span>
          </div>
          <Typography.Title level={4} style={{ color: '#00203F', marginTop: 0 }}>
            Ma trận Eisenhower
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            Nhập mã truy cập của phòng để xem bảng công việc dùng chung.
          </Typography.Paragraph>

          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="accessKey"
              rules={[{ required: true, message: 'Vui lòng nhập mã truy cập.' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mã truy cập"
                autoFocus
                size="large"
              />
            </Form.Item>

            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              Đăng nhập
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <AccessContext.Provider value={{ accessKey, signOut }}>{children}</AccessContext.Provider>
  );
}
