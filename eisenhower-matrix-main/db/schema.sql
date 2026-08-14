-- =========================================================
-- Ma trận Eisenhower - VietinBank Bắc Nghệ An
-- Lược đồ cơ sở dữ liệu (Neon / PostgreSQL) - phiên bản 2
-- Chạy 1 lần trong Neon SQL Editor. Chạy lại cũng không sao.
-- =========================================================

CREATE TABLE IF NOT EXISTS tasks (
  id          BIGSERIAL PRIMARY KEY,
  workspace   TEXT        NOT NULL DEFAULT 'bac-nghe-an',
  quadrant    TEXT        NOT NULL CHECK (quadrant IN (
                  'urgent-important',
                  'not-urgent-important',
                  'urgent-not-important',
                  'not-urgent-not-important')),
  content     TEXT        NOT NULL,
  completed   BOOLEAN     NOT NULL DEFAULT FALSE,
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --- Bổ sung cho phiên bản 2: theo dõi việc giao cho các phòng -------------
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee   TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category   TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS note       TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date   DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'chua-bat-dau';

-- Đồng bộ trạng thái cho dữ liệu cũ (nếu có)
UPDATE tasks SET status = 'hoan-thanh' WHERE completed AND status <> 'hoan-thanh';

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('chua-bat-dau', 'dang-lam', 'hoan-thanh'));

-- Chỉ mục phục vụ hiển thị và lọc
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_quadrant_position
  ON tasks (workspace, quadrant, position, id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks (workspace, department);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON tasks (workspace, due_date);

-- Tự cập nhật thời điểm sửa đổi
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
