'use client';

import { useCommonTranslation } from '@/hooks/useTranslation';

export function Footer() {
  const { t } = useCommonTranslation();

  return (
    <footer className="border-t-4 border-[#003B71] bg-white mt-8 sm:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
        <p className="text-xs sm:text-sm font-semibold text-[#003B71]">
          {t('footer.text')}
        </p>
        <p className="text-[11px] sm:text-xs text-[#7A8FA6] mt-1">
          {t('footer.note')}
        </p>
      </div>
    </footer>
  );
}
