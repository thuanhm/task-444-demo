import type { Metadata } from "next";
import { ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TranslationProvider } from "@/components/TranslationProvider";
import { AntdThemeProvider } from "@/components/AntdThemeProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import {
  DEFAULT_LOCALE,
  getCommonMessages,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";
import { Analytics } from "@vercel/analytics/next";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

// Xác định ngôn ngữ hợp lệ, mặc định là tiếng Việt
const resolveLocale = (rawLocale: string): Locale => {
  return isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const messages = getCommonMessages(locale);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const basePath = `/${locale}`;
  const canonicalUrl = siteUrl ? `${siteUrl}${basePath}` : basePath;

  const title =
    messages.seo?.title ?? "Ma trận Eisenhower – Công cụ ưu tiên công việc";
  const description =
    messages.seo?.description ??
    "Sắp xếp công việc theo mức độ khẩn cấp và quan trọng.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        vi: siteUrl ? `${siteUrl}/vi` : "/vi",
        en: siteUrl ? `${siteUrl}/en` : "/en",
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      locale: locale === "vi" ? "vi_VN" : "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    other: {
      "application-name": messages.appName ?? "Ma trận Eisenhower",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const messages = getCommonMessages(locale);

  return (
    <html lang={locale === "vi" ? "vi" : "en"}>
      <body className="antialiased">
        <AntdRegistry>
          <AntdThemeProvider locale={locale}>
            <TranslationProvider locale={locale} messages={messages}>
              {children}
              <Analytics />
            </TranslationProvider>
          </AntdThemeProvider>
        </AntdRegistry>
        <SpeedInsights />
      </body>
    </html>
  );
}
