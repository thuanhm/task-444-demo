'use client';

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

  const controlClass =
    'w-full px-2 py-1.5 border-2 border-[#003B71] bg-white text-xs sm:text-sm text-[#003B71] focus:outline-none focus:ring-2 focus:ring-[#0072BC]';
  const labelClass =
    'block text-[10px] font-bold uppercase tracking-wide text-[#7A8FA6] mb-1';

  return (
    <section className="bg-white border-2 border-[#003B71] p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="col-span-2 lg:col-span-1">
          <label className={labelClass}>{t('filters.keyword')}</label>
          <input
            className={controlClass}
            placeholder={t('filters.keywordPlaceholder')}
            value={filters.keyword}
            onChange={(e) => set({ keyword: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>{t('fields.department')}</label>
          <select
            className={controlClass}
            value={filters.department}
            onChange={(e) => set({ department: e.target.value })}
          >
            <option value="">{t('filters.all')}</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('fields.assignee')}</label>
          <select
            className={controlClass}
            value={filters.assignee}
            onChange={(e) => set({ assignee: e.target.value })}
          >
            <option value="">{t('filters.all')}</option>
            {assignees.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('fields.category')}</label>
          <select
            className={controlClass}
            value={filters.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="">{t('filters.all')}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('fields.status')}</label>
          <select
            className={controlClass}
            value={filters.status}
            onChange={(e) => set({ status: e.target.value as TaskStatus | 'all' })}
          >
            <option value="all">{t('filters.all')}</option>
            {STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {t(`status.${status.id}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t('filters.dueFrom')}</label>
          <input
            type="date"
            className={controlClass}
            value={filters.dueFrom}
            onChange={(e) => set({ dueFrom: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass}>{t('filters.dueTo')}</label>
          <input
            type="date"
            className={controlClass}
            value={filters.dueTo}
            onChange={(e) => set({ dueTo: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#003B71]">
          <input
            type="checkbox"
            className="custom-checkbox"
            checked={filters.onlyAtRisk}
            onChange={(e) => set({ onlyAtRisk: e.target.checked })}
          />
          {t('filters.onlyAtRisk')}
        </label>

        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_FILTERS })}
          className="btn-white px-4 py-1.5 text-xs font-bold uppercase"
        >
          {t('filters.reset')}
        </button>
      </div>
    </section>
  );
}
