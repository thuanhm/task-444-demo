'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { QUADRANTS, STATUSES } from '@/constants';
import type { QuadrantType, Task, TaskInput, TaskStatus } from '@/types';

interface TaskFormModalProps {
  isOpen: boolean;
  /** Nhóm đang thêm mới; khi sửa thì là nhóm hiện tại của công việc */
  quadrant: QuadrantType | null;
  /** Có giá trị nghĩa là đang sửa, không có nghĩa là thêm mới */
  task: Task | null;
  departments: string[];
  assignees: string[];
  categories: string[];
  onClose: () => void;
  onSubmit: (quadrant: QuadrantType, input: TaskInput) => void;
}

const emptyInput = (): TaskInput => ({
  text: '',
  department: '',
  assignee: '',
  dueDate: '',
  category: '',
  status: 'chua-bat-dau',
  note: '',
});

export function TaskFormModal({
  isOpen,
  quadrant,
  task,
  departments,
  assignees,
  categories,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const { t } = useCommonTranslation();
  const [form, setForm] = useState<TaskInput>(emptyInput());
  const [targetQuadrant, setTargetQuadrant] = useState<QuadrantType>('urgent-important');

  // Nạp dữ liệu mỗi khi mở hộp thoại
  useEffect(() => {
    if (!isOpen) return;
    setTargetQuadrant(quadrant ?? 'urgent-important');
    setForm(
      task
        ? {
            text: task.text,
            department: task.department,
            assignee: task.assignee,
            dueDate: task.dueDate,
            category: task.category,
            status: task.status,
            note: task.note,
          }
        : emptyInput(),
    );
  }, [isOpen, quadrant, task]);

  if (!isOpen) return null;

  const update = (patch: Partial<TaskInput>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.text.trim()) return;
    onSubmit(targetQuadrant, { ...form, text: form.text.trim() });
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 border-2 border-[#003B71] text-sm focus:outline-none focus:ring-2 focus:ring-[#0072BC]';
  const labelClass = 'block text-xs font-semibold mb-1 text-[#003B71]';

  return (
    <div className="fixed inset-0 bg-[#003B71]/50 flex items-start sm:items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div className="bg-white border-2 border-[#003B71] max-w-2xl w-full p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 text-[#003B71]">
          {task ? t('modals.taskForm.editTitle') : t('modals.taskForm.addTitle')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{t('modals.taskForm.contentLabel')}</label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder={t('modals.taskForm.contentPlaceholder')}
              value={form.text}
              onChange={(e) => update({ text: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('fields.department')}</label>
              <input
                list="danh-sach-phong"
                className={inputClass}
                placeholder={t('modals.taskForm.departmentPlaceholder')}
                value={form.department}
                onChange={(e) => update({ department: e.target.value })}
              />
              <datalist id="danh-sach-phong">
                {departments.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>{t('fields.assignee')}</label>
              <input
                list="danh-sach-nguoi"
                className={inputClass}
                placeholder={t('modals.taskForm.assigneePlaceholder')}
                value={form.assignee}
                onChange={(e) => update({ assignee: e.target.value })}
              />
              <datalist id="danh-sach-nguoi">
                {assignees.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>{t('fields.dueDate')}</label>
              <input
                type="date"
                className={inputClass}
                value={form.dueDate}
                onChange={(e) => update({ dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>{t('fields.category')}</label>
              <input
                list="danh-sach-loai"
                className={inputClass}
                placeholder={t('modals.taskForm.categoryPlaceholder')}
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
              />
              <datalist id="danh-sach-loai">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>{t('fields.status')}</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => update({ status: e.target.value as TaskStatus })}
              >
                {STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {t(`status.${status.id}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>{t('fields.quadrant')}</label>
              <select
                className={inputClass}
                value={targetQuadrant}
                onChange={(e) => setTargetQuadrant(e.target.value as QuadrantType)}
              >
                {QUADRANTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {t(`quadrants.${quadrantKey(item.id)}.title`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('fields.note')}</label>
            <textarea
              rows={2}
              className={inputClass}
              placeholder={t('modals.taskForm.notePlaceholder')}
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="btn-blue flex-1 px-6 py-2.5 font-bold text-sm uppercase"
            >
              {task ? t('modals.taskForm.save') : t('modals.taskForm.submit')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-white px-6 py-2.5 font-bold text-sm uppercase"
            >
              {t('modals.taskForm.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Đổi mã nhóm sang khóa dịch tương ứng */
export function quadrantKey(id: QuadrantType) {
  switch (id) {
    case 'urgent-important':
      return 'doFirst';
    case 'not-urgent-important':
      return 'schedule';
    case 'urgent-not-important':
      return 'delegate';
    case 'not-urgent-not-important':
      return 'eliminate';
  }
}
