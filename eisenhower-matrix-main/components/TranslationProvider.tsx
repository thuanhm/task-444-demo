'use client';

import { createContext, useContext, ReactNode, useMemo } from "react";
import type { Locale } from "@/i18n/config";

interface TranslationContextValue {
  locale: Locale;
  messages: Record<string, unknown>;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

interface TranslationProviderProps {
  locale: Locale;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export const TranslationProvider = ({
  locale,
  messages,
  children,
}: TranslationProviderProps) => {
  const value = useMemo<TranslationContextValue>(() => {
    const getMessage = (key: string): string => {
      const segments = key.split(".");
      let current: unknown = messages;

      for (const segment of segments) {
        if (
          typeof current === "object" &&
          current !== null &&
          segment in current
        ) {
          current = (current as Record<string, unknown>)[segment];
        } else {
          return key;
        }
      }

      return typeof current === "string" ? current : key;
    };

    return {
      locale,
      messages,
      t: getMessage,
    };
  }, [locale, messages]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const ctx = useContext(TranslationContext);

  if (!ctx) {
    throw new Error("useTranslationContext must be used within TranslationProvider");
  }

  return ctx;
};


