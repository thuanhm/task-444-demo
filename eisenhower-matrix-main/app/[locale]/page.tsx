'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Statistic, Alert, Row, Col, Spin } from 'antd';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QuadrantCard } from '@/components/QuadrantCard';
import { TaskFormModal } from '@/components/TaskFormModal';
import { StatisticsModal } from '@/components/StatisticsModal';
import { DeadlineAlertModal } from '@/components/DeadlineAlertModal';
import { FilterBar } from '@/components/FilterBar';
import { ReportModal } from '@/components/ReportModal';
import { TaskItem } from '@/components/TaskItem';
import { AccessProvider, useAccess } from '@/components/AccessGate';
import { useTasks } from '@/hooks/useTasks';
import { useCommonTranslation } from '@/hooks/useTranslation';
import {
  QUADRANTS,
  EMPTY_FILTERS,
  DEFAULT_THRESHOLDS,
  THRESHOLD_STORAGE_KEY,
  DEADLINE_COLORS,
} from '@/constants';
import {
  filterBoard,
  uniqueValues,
  summarize,
  atRiskTasks,
} from '@/lib/taskUtils';
import { exportToExcel, downloadTemplate, readTasksFromFile } from '@/lib/excel';
import type {
  DeadlineThresholds,
  QuadrantType,
  Task,
  TaskFilters,
  TaskInput,
} from '@/types';

export default function HomePage() {
  // Yêu cầu mã truy cập trước khi vào bảng công việc dùng chung
  return (
    <AccessProvider>
      <TaskBoard />
    </AccessProvider>
  );
}

function TaskBoard() {
  const {
    tasks,
    isLoading,
    isSyncing,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearAllTasks,
    importTasks,
  } = useTasks();
  const { signOut } = useAccess();
  const { t } = useCommonTranslation();

  const [filters, setFilters] = useState<TaskFilters>({ ...EMPTY_FILTERS });
  const [thresholds, setThresholds] = useState<DeadlineThresholds>(DEFAULT_THRESHOLDS);
  const [formQuadrant, setFormQuadrant] = useState<QuadrantType | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ngưỡng cảnh báo được ghi nhớ trên từng máy
  useEffect(() => {
    const saved = localStorage.getItem(THRESHOLD_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as DeadlineThresholds;
      if (typeof parsed?.red === 'number' && typeof parsed?.amber === 'number') {
        setThresholds(parsed);
      }
    } catch {
      // bỏ qua dữ liệu hỏng
    }
  }, []);

  const changeThresholds = (next: DeadlineThresholds) => {
    setThresholds(next);
    localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(next));
  };

  const departments = useMemo(() => uniqueValues(tasks, 'department'), [tasks]);
  const assignees = useMemo(() => uniqueValues(tasks, 'assignee'), [tasks]);
  const categories = useMemo(() => uniqueValues(tasks, 'category'), [tasks]);

  const visibleTasks = useMemo(
    () => filterBoard(tasks, filters, thresholds),
    [tasks, filters, thresholds],
  );
  const summary = useMemo(() => summarize(visibleTasks, thresholds), [visibleTasks, thresholds]);
  const alertCount = useMemo(
    () => atRiskTasks(tasks, thresholds).length,
    [tasks, thresholds],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openAddForm = (quadrant: QuadrantType) => {
    setEditingTask(null);
    setFormQuadrant(quadrant);
    setIsFormOpen(true);
  };

  const openEditForm = (quadrant: QuadrantType, task: Task) => {
    setEditingTask(task);
    setFormQuadrant(quadrant);
    setIsFormOpen(true);
  };

  const handleSubmitForm = (targetQuadrant: QuadrantType, input: TaskInput) => {
    if (editingTask && formQuadrant) {
      updateTask(formQuadrant, editingTask.id, input);
      // Nếu người dùng đổi nhóm ưu tiên trong biểu mẫu thì chuyển thẻ sang nhóm mới
      if (targetQuadrant !== formQuadrant) {
        moveTask(formQuadrant, targetQuadrant, editingTask.id, 0);
      }
      return;
    }
    addTask(targetQuadrant, input);
  };

  const handleClearAll = () => {
    if (confirm(t('confirm.clearAll'))) clearAllTasks();
  };

  const handleDelete = (quadrant: QuadrantType, taskId: number) => {
    if (confirm(t('confirm.deleteTask'))) deleteTask(quadrant, taskId);
  };

  const handleExport = () => {
    exportToExcel(visibleTasks);
    setNotice(t('notices.exported'));
  };

  const handleImportFile = async (file: File) => {
    try {
      const rows = await readTasksFromFile(file);
      if (rows.length === 0) {
        setNotice(t('notices.importEmpty'));
        return;
      }
      const inserted = await importTasks(rows);
      setNotice(`${t('notices.imported')} ${inserted}`);
    } catch {
      setNotice(t('notices.importFailed'));
    }
  };

  // --- Kéo thả ---------------------------------------------------------
  const findContainer = (id: UniqueIdentifier): QuadrantType | undefined => {
    if (QUADRANTS.some((q) => q.id === id)) return id as QuadrantType;
    const idStr = String(id);
    for (const quadrant of QUADRANTS) {
      if (idStr.startsWith(quadrant.id + '-')) return quadrant.id;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setActiveQuadrant(findContainer(event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveQuadrant(null);
    if (!over) return;

    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to) return;

    const activeTaskId = parseInt(String(active.id).split('-').pop() || '0');
    const overTaskId = parseInt(String(over.id).split('-').pop() || '0');

    if (from !== to) {
      const overIndex = tasks[to].findIndex((task) => task.id === overTaskId);
      moveTask(from, to, activeTaskId, overIndex === -1 ? tasks[to].length : overIndex);
      return;
    }

    const oldIndex = tasks[from].findIndex((task) => task.id === activeTaskId);
    const newIndex = tasks[from].findIndex((task) => task.id === overTaskId);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      moveTask(from, from, activeTaskId, newIndex);
    }
  };

  const activeTask = useMemo(() => {
    if (!activeId || !activeQuadrant) return null;
    const taskId = parseInt(String(activeId).split('-').pop() || '0');
    return tasks[activeQuadrant].find((task) => task.id === taskId) ?? null;
  }, [activeId, activeQuadrant, tasks]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onClearAll={handleClearAll}
        onShowStatistics={() => setIsStatisticsOpen(true)}
        onShowDeadlines={() => setIsDeadlineOpen(true)}
        onShowReport={() => setIsReportOpen(true)}
        onExport={handleExport}
        onImport={() => {
          if (confirm(t('confirm.importFile'))) fileInputRef.current?.click();
        }}
        onDownloadTemplate={downloadTemplate}
        onSignOut={signOut}
        alertCount={alertCount}
        isSyncing={isSyncing}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />

      {error && (
        <div className="px-4 sm:px-6 pt-3">
          <Alert type="error" message={error} showIcon closable className="max-w-7xl mx-auto" />
        </div>
      )}

      {notice && (
        <div className="px-4 sm:px-6 pt-3">
          <Alert
            type="info"
            message={notice}
            showIcon
            closable
            onClose={() => setNotice(null)}
            className="max-w-7xl mx-auto"
          />
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex-1 w-full">
        {/* Dải số liệu nhanh */}
        <Row gutter={[8, 8]} className="mb-4 sm:mb-6">
          {[
            { label: t('summary.total'), value: summary.total, color: '#00203F' },
            { label: t('status.chua-bat-dau'), value: summary.notStarted, color: '#5C6B7F' },
            { label: t('status.dang-lam'), value: summary.inProgress, color: '#004A8F' },
            { label: t('status.hoan-thanh'), value: summary.done, color: '#1E8E5A' },
            { label: t('summary.overdue'), value: summary.overdue, color: DEADLINE_COLORS.overdue },
            { label: t('summary.dueSoon'), value: summary.dueSoon, color: DEADLINE_COLORS.amber },
          ].map((item) => (
            <Col key={item.label} span={8} lg={4}>
              <Card
                size="small"
                style={{ border: '1px solid #DCE3EC', borderRadius: 8, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,32,63,0.08)' }}
                styles={{ body: { padding: '10px 8px' } }}
              >
                <Statistic value={item.value} valueStyle={{ color: item.color, fontSize: 22, fontWeight: 700 }} />
                <div className="text-[10px] sm:text-xs text-[#5C6B7F] mt-0.5">{item.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <FilterBar
          filters={filters}
          departments={departments}
          assignees={assignees}
          categories={categories}
          onChange={setFilters}
        />

        {isLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[#5C6B7F]">
            <Spin size="small" /> {t('states.loading')}
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {QUADRANTS.map((quadrant) => (
              <QuadrantCard
                key={quadrant.id}
                config={quadrant}
                tasks={visibleTasks[quadrant.id]}
                thresholds={thresholds}
                onAddTask={() => openAddForm(quadrant.id)}
                onToggleTask={(taskId) => toggleTask(quadrant.id, taskId)}
                onDeleteTask={(taskId) => handleDelete(quadrant.id, taskId)}
                onEditTask={(task) => openEditForm(quadrant.id, task)}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.5' } },
              }),
            }}
          >
            {activeTask && activeQuadrant ? (
              <TaskItem
                task={activeTask}
                quadrant={activeQuadrant}
                thresholds={thresholds}
                onToggle={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <Footer />

      <TaskFormModal
        isOpen={isFormOpen}
        quadrant={formQuadrant}
        task={editingTask}
        departments={departments}
        assignees={assignees}
        categories={categories}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        tasks={visibleTasks}
        thresholds={thresholds}
      />

      <ReportModal
        isOpen={isReportOpen}
        tasks={visibleTasks}
        onClose={() => setIsReportOpen(false)}
        onApplyDateFilter={(from, to) =>
          setFilters((prev) => ({ ...prev, dueFrom: from, dueTo: to }))
        }
      />

      <DeadlineAlertModal
        isOpen={isDeadlineOpen}
        tasks={tasks}
        thresholds={thresholds}
        onChangeThresholds={changeThresholds}
        onClose={() => setIsDeadlineOpen(false)}
      />
    </div>
  );
}
