'use client';

import { Layout, Space, Button, Badge } from 'antd';
import {
  BellOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  ClearOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const { Header: AntHeader } = Layout;

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

  return (
    <AntHeader
      style={{
        height: 'auto',
        lineHeight: 'normal',
        padding: 0,
        background: 'linear-gradient(90deg, rgb(0, 89, 147), rgb(215, 18, 73))',
        boxShadow: '0 2px 8px rgba(0,32,63,0.25)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-5 sm:h-6 bg-[#D8A13B]" />
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

          <Space wrap size={8}>
            <LanguageSwitcher />

            <Badge count={alertCount} size="small" offset={[-4, 4]}>
              <Button icon={<BellOutlined />} onClick={onShowDeadlines}>
                {t('actions.deadlines')}
              </Button>
            </Badge>

            <Button icon={<FileTextOutlined />} onClick={onShowReport}>
              {t('actions.report')}
            </Button>

            <Button icon={<BarChartOutlined />} onClick={onShowStatistics}>
              {t('actions.stats')}
            </Button>

            <Button icon={<DownloadOutlined />} onClick={onExport}>
              {t('actions.export')}
            </Button>

            <Button icon={<UploadOutlined />} onClick={onImport}>
              {t('actions.import')}
            </Button>

            <Button
              type="text"
              icon={<FileExcelOutlined />}
              onClick={onDownloadTemplate}
              className="!text-white hover:!text-white/80"
            >
              {t('actions.template')}
            </Button>

            <Button
              type="text"
              danger
              icon={<ClearOutlined />}
              onClick={onClearAll}
              className="!text-white hover:!text-white/80"
            >
              {t('actions.clearAll')}
            </Button>

            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={onSignOut}
              className="!text-white hover:!text-white/80"
            >
              {t('actions.signOut')}
            </Button>
          </Space>
        </div>
      </div>
    </AntHeader>
  );
}
