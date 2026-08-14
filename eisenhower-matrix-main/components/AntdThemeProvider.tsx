'use client';

import { ReactNode } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import type { Locale } from '@/i18n/config';

/**
 * Cấu hình chủ đề Ant Design theo nhận diện thương hiệu VietinBank.
 * Đổi màu ở một chỗ duy nhất, toàn bộ component AntD (Button, Table,
 * DatePicker, Select...) tự đồng bộ theo.
 */
const vietinbankTheme = {
  token: {
    colorPrimary: '#004A8F',
    colorInfo: '#004A8F',
    colorSuccess: '#1E8E5A',
    colorWarning: '#D8A13B',
    colorError: '#EE1C25',
    colorLink: '#004A8F',
    colorTextBase: '#00203F',
    colorBorder: '#DCE3EC',
    borderRadius: 2,
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
  },
  components: {
    Button: {
      colorPrimary: '#004A8F',
      algorithm: true,
      fontWeight: 600,
      primaryShadow: 'none',
    },
    Layout: {
      headerBg: '#004A8F',
    },
    Table: {
      headerBg: '#E3EDF7',
      headerColor: '#00203F',
      borderColor: '#DCE3EC',
      rowHoverBg: '#EEF2F7',
    },
    Modal: {
      headerBg: '#FFFFFF',
      titleColor: '#00203F',
    },
    Tag: {
      defaultBg: '#EEF2F7',
    },
    Card: {
      colorBorderSecondary: '#DCE3EC',
    },
  },
};

export function AntdThemeProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <ConfigProvider theme={vietinbankTheme} locale={locale === 'vi' ? viVN : enUS}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
