'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useCommonTranslation } from '@/hooks/useTranslation';

type SwitchLocale = 'vi' | 'en';

const LOCALE_OPTIONS: { value: SwitchLocale; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useCommonTranslation();

  const switchLanguage = (targetLocale: SwitchLocale) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    if (segments.length > 1) segments[1] = targetLocale;
    router.push(segments.join('/') || '/');
  };

  return (
    <Select<SwitchLocale>
      value={locale as SwitchLocale}
      onChange={switchLanguage}
      options={LOCALE_OPTIONS}
      suffixIcon={<GlobalOutlined />}
      style={{ width: 140 }}
    />
  );
};
