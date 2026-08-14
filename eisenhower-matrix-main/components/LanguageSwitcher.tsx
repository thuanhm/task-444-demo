'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { useEffect, useRef, useState } from 'react';

type SwitchLocale = 'vi' | 'en';

// Danh sách ngôn ngữ hiển thị trên thanh chuyển đổi
const LOCALE_OPTIONS: { value: SwitchLocale; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useCommonTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Đổi ngôn ngữ bằng cách thay đoạn đầu tiên của đường dẫn
  const switchLanguage = (targetLocale: SwitchLocale) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    if (segments.length > 1) {
      segments[1] = targetLocale;
    }
    const nextPath = segments.join('/') || '/';
    router.push(nextPath);
  };

  const currentOption =
    LOCALE_OPTIONS.find((option) => option.value === locale) ?? LOCALE_OPTIONS[0];

  // Đóng danh sách khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative text-xs sm:text-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 px-3 py-1.5 border-2 border-[#003B71] bg-white text-[#003B71] font-semibold uppercase hover:-translate-y-px hover:-translate-x-px transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span>{currentOption.label}</span>
        <span className="text-[10px] sm:text-[11px]">▼</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white border-2 border-[#003B71] shadow-md z-20">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                switchLanguage(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-[#DCEBF8] text-[#003B71] ${
                locale === option.value ? 'bg-[#0072BC] text-white font-bold' : ''
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
