'use client';

import { useTranslationContext } from "@/components/TranslationProvider";

export const useCommonTranslation = () => {
  const { t, locale } = useTranslationContext();

  return {
    t,
    locale,
  };
};


