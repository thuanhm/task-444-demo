import viCommon from "@/public/locales/vi/common.json";
import enCommon from "@/public/locales/en/common.json";

// Ngôn ngữ hỗ trợ: Tiếng Việt (mặc định) và Tiếng Anh
export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";

type CommonMessages = typeof viCommon;

const dictionaries: Record<Locale, CommonMessages> = {
  vi: viCommon,
  en: enCommon,
};

// Lấy bộ từ điển theo ngôn ngữ, mặc định trả về tiếng Việt
export const getCommonMessages = (locale: Locale): CommonMessages => {
  return dictionaries[locale] ?? dictionaries.vi;
};

// Kiểm tra một chuỗi có phải ngôn ngữ được hỗ trợ hay không
export const isSupportedLocale = (value: string): value is Locale => {
  return (LOCALES as readonly string[]).includes(value);
};
