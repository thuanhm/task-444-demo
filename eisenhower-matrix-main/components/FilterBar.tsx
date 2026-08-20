'use client';

import { Card, Row, Col, Input, Select, DatePicker, Checkbox, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { EMPTY_FILTERS, STATUSES } from '@/constants';
import type { TaskFilters, TaskStatus } from '@/types';

interface FilterBarProps {
  filters: TaskFilters;
  departments: string[];
  assignees: string[];
  categories: string[];
  onChange: (filters: TaskFilters) => void;
}

const toDayjs = (value: string): Dayjs | null => (value ? dayjs(value) : null);
const toDateString = (value: Dayjs | null): string => (value ? value.format('YYYY-MM-DD') : '');

/** Thanh lọc công việc: theo phòng, cán bộ, loại việc, trạng thái, khoảng hạn chót */
export function FilterBar({
  filters,
  departments,
  assignees,
  categories,
  onChange,
}: FilterBarProps) {
  const { t } = useCommonTranslation();
  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });

  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  return (
    <Card size="small" style={{ border: '1px solid #DCE3EC', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,32,63,0.08)' }} className="mb-4 sm:mb-6">
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('filters.keyword')}
          </label>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('filters.keywordPlaceholder')}
            value={filters.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('fields.department')}
          </label>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder={t('filters.all')}
            value={filters.department || undefined}
            onChange={(value) => set({ department: value ?? '' })}
            options={toOptions(departments)}
            showSearch
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('fields.assignee')}
          </label>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder={t('filters.all')}
            value={filters.assignee || undefined}
            onChange={(value) => set({ assignee: value ?? '' })}
            options={toOptions(assignees)}
            showSearch
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('fields.category')}
          </label>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder={t('filters.all')}
            value={filters.category || undefined}
            onChange={(value) => set({ category: value ?? '' })}
            options={toOptions(categories)}
            showSearch
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('fields.status')}
          </label>
          <Select
            style={{ width: '100%' }}
            value={filters.status}
            onChange={(value) => set({ status: value as TaskStatus | 'all' })}
            options={[
              { value: 'all', label: t('filters.all') },
              ...STATUSES.map((s) => ({ value: s.id, label: t(`status.${s.id}`) })),
            ]}
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('filters.dueFrom')}
          </label>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            value={toDayjs(filters.dueFrom)}
            onChange={(value) => set({ dueFrom: toDateString(value) })}
          />
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#5C6B7F] mb-1">
            {t('filters.dueTo')}
          </label>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            value={toDayjs(filters.dueTo)}
            onChange={(value) => set({ dueTo: toDateString(value) })}
          />
        </Col>
      </Row>

      <Space wrap className="mt-3" size={12}>
        <Checkbox
          checked={filters.onlyAtRisk}
          onChange={(e) => set({ onlyAtRisk: e.target.checked })}
        >
          <span className="text-xs sm:text-sm font-semibold text-[#00203F]">
            {t('filters.onlyAtRisk')}
          </span>
        </Checkbox>

        <Button icon={<ReloadOutlined />} onClick={() => onChange({ ...EMPTY_FILTERS })}>
          {t('filters.reset')}
        </Button>
      </Space>
    </Card>
  );
}
