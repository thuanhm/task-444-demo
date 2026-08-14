'use client';

import { useCommonTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface HeaderProps {
  onClearAll: () => void;
  onShowStatistics: () => void;
  onShowDeadlines: () => void;
  onShowReport: () => void;
  onExport: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  onSignOut: () => void;
  alertCount?: number;
  isSyncing?: boolean;
}

export function Header({
  onClearAll,
  onShowStatistics,
  onShowDeadlines,
  onShowReport,
  onExport,
  onImport,
  onDownloadTemplate,
  onSignOut,
  alertCount = 0,
  isSyncing = false,
}: HeaderProps) {
  const { t } = useCommonTranslation();

  const buttonClass =
    'px-3 py-1.5 border-2 border-[#003B71] font-semibold uppercase text-xs sm:text-sm hover:-translate-y-px hover:-translate-x-px transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <header className="bg-[#0072BC] border-b-4 border-[#003B71]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-5 sm:h-6 bg-[#F5A81C]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/90">
                {t('header.unit')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-white">
              {t('header.title')}
            </h1>
            <p className="text-sm text-white/85">
              {t('header.subtitle')}
              {isSyncing && (
                <span className="ml-2 text-xs text-white/70">{t('states.syncing')}</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <LanguageSwitcher />

            {/* Cảnh báo hạn chót, kèm số việc đang đến hạn */}
            <button
              onClick={onShowDeadlines}
              className={`${buttonClass} bg-[#F5A81C] text-[#003B71]`}
            >
              🔔 {t('actions.deadlines')}
              {alertCount > 0 && (
                <span className="ml-1 px-1.5 bg-[#E31837] text-white">{alertCount}</span>
              )}
            </button>

            <button
              onClick={onShowReport}
              className={`${buttonClass} bg-white text-[#003B71]`}
            >
              🖋 {t('actions.report')}
            </button>

            <button
              onClick={onShowStatistics}
              className={`${buttonClass} bg-white text-[#003B71]`}
            >
              📊 {t('actions.stats')}
            </button>

            <button
              onClick={onExport}
              className={`${buttonClass} bg-white text-[#003B71]`}
            >
              ⬇ {t('actions.export')}
            </button>

            <button
              onClick={onImport}
              className={`${buttonClass} bg-white text-[#003B71]`}
            >
              ⬆ {t('actions.import')}
            </button>

            <button
              onClick={onDownloadTemplate}
              className={`${buttonClass} bg-transparent text-white border-white/70 hover:bg-white/10`}
            >
              {t('actions.template')}
            </button>

            <button
              onClick={onClearAll}
              className={`${buttonClass} bg-transparent text-white border-white/70 hover:bg-white/10`}
            >
              {t('actions.clearAll')}
            </button>

            <button
              onClick={onSignOut}
              className={`${buttonClass} bg-transparent text-white border-white/70 hover:bg-white/10`}
            >
              {t('actions.signOut')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
