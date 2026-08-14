'use client';

import { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, AutoComplete, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useCommonTranslation } from '@/hooks/useTranslation';
import { QUADRANTS, STATUSES } from '@/constants';
import type { QuadrantType, Task, TaskInput, TaskStatus } from '@/types';

const { TextArea } = Input;

interface TaskFormModalProps {
  isOpen: boolean;
  quadrant: QuadrantType | null;
  task: Task | null;
  departments: string[];
  assignees: string[];
  categories: string[];
  onClose: () => void;
  onSubmit: (quadrant: QuadrantType, input: TaskInput) => void;
}

interface FormValues {
  text: string;
  department?: string;
  assignee?: string;
  dueDate?: Dayjs | null;
  category?: string;
  status: TaskStatus;
  quadrant: QuadrantType;
  note?: string;
}

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
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!isOpen) return;
    form.setFieldsValue(
      task
        ? {
            text: task.text,
            department: task.department,
            assignee: task.assignee,
            dueDate: task.dueDate ? dayjs(task.dueDate) : null,
            category: task.category,
            status: task.status,
            quadrant: quadrant ?? 'urgent-important',
            note: task.note,
          }
        : {
            text: '',
            department: '',
            assignee: '',
            dueDate: null,
            category: '',
            status: 'chua-bat-dau',
            quadrant: quadrant ?? 'urgent-important',
            note: '',
          },
    );
  }, [isOpen, quadrant, task, form]);

  const handleFinish = (values: FormValues) => {
    const input: TaskInput = {
      text: values.text.trim(),
      department: values.department?.trim() ?? '',
      assignee: values.assignee?.trim() ?? '',
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : '',
      category: values.category?.trim() ?? '',
      status: values.status,
      note: values.note?.trim() ?? '',
    };
    onSubmit(values.quadrant, input);
    onClose();
  };

  const toOptions = (values: string[]) => values.map((v) => ({ value: v }));

  return (
    <Modal
      title={task ? t('modals.taskForm.editTitle') : t('modals.taskForm.addTitle')}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={640}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
        <Form.Item
          name="text"
          label={t('modals.taskForm.contentLabel')}
          rules={[{ required: true, message: t('modals.taskForm.contentLabel') }]}
        >
          <TextArea rows={2} placeholder={t('modals.taskForm.contentPlaceholder')} autoFocus />
        </Form.Item>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item name="department" label={t('fields.department')}>
            <AutoComplete
              options={toOptions(departments)}
              placeholder={t('modals.taskForm.departmentPlaceholder')}
              filterOption={(input, option) =>
                (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="assignee" label={t('fields.assignee')}>
            <AutoComplete
              options={toOptions(assignees)}
              placeholder={t('modals.taskForm.assigneePlaceholder')}
              filterOption={(input, option) =>
                (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="dueDate" label={t('fields.dueDate')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="category" label={t('fields.category')}>
            <AutoComplete
              options={toOptions(categories)}
              placeholder={t('modals.taskForm.categoryPlaceholder')}
              filterOption={(input, option) =>
                (option?.value as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="status" label={t('fields.status')}>
            <Select
              options={STATUSES.map((s) => ({ value: s.id, label: t(`status.${s.id}`) }))}
            />
          </Form.Item>

          <Form.Item name="quadrant" label={t('fields.quadrant')}>
            <Select
              options={QUADRANTS.map((q) => ({
                value: q.id,
                label: t(`quadrants.${quadrantKey(q.id)}.title`),
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item name="note" label={t('fields.note')}>
          <TextArea rows={2} placeholder={t('modals.taskForm.notePlaceholder')} />
        </Form.Item>

        <div className="flex gap-3 pt-1">
          <Button type="primary" htmlType="submit" block size="large">
            {task ? t('modals.taskForm.save') : t('modals.taskForm.submit')}
          </Button>
          <Button onClick={onClose} size="large">
            {t('modals.taskForm.cancel')}
          </Button>
        </div>
      </Form>
    </Modal>
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
